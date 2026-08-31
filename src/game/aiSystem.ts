/**
 * ============================================================================
 * 1v4 ASYMMETRIC GAME — AI NPC BEHAVIOR SYSTEM
 * ============================================================================
 * 
 * Strict implementation of Global AI Rules (G1-G5), Survivor Priority Tree (Actions 1-5),
 * and Killer Priority Tree (Moves 1-5).
 * 
 * Global Rules:
 * G1: Real-time decision evaluated every tick.
 * G2: Interrupt rule - higher priority interrupts lower priority.
 * G3: Invalid target abandonment immediately.
 * G4: No permanent action lock.
 * G5: Dead/Escaped AI stops all actions; Game Over stops all AI.
 * 
 * NEVER controls human-operated players (human is excluded from AI loop).
 */

import * as THREE from 'three';
import {
  PlayerState,
  GeneratorState,
  ExitGateState,
  CageState,
  LoudNoisePing,
  ScratchMark,
  HealthState,
} from '../types';
import { sound } from '../audio';
import { spawnIceAttackProjectile, ActiveIceProjectile } from './iceProjectile';
import { processGourmetHitOnSurvivor } from './gourmetCharacter';
import { castKentoSurgeSkill, checkKentoSkillCondition } from './kentoCharacter';
import { castErikSkill, checkErikSkillCondition } from './erikCharacter';
import { castJackSkill, checkJackSkillCondition } from './jackCharacter';
import { castTariqBetrayalSkill, checkTariqSkillCondition } from './tariqCharacter';

export interface CollisionCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface AIGameContext {
  delta: number;
  mapColliders: CollisionCollider[];
  genPositions: { x: number; z: number }[];
  generators: GeneratorState[];
  exitGates: ExitGateState[];
  cages: CageState[];
  allPlayers: PlayerState[];
  humanPlayerId: string;
  killerBreakCharges: number;
  noisePings: LoudNoisePing[];
  scratchMarks: ScratchMark[];
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  playerMeshes: Record<string, THREE.Group>;
  iceProjectiles: ActiveIceProjectile[];
  endgameStallTimer?: number;
  onAddNoisePing: (ping: LoudNoisePing) => void;
  onSetKillerBreakCharges: (updater: (prev: number) => number) => void;
  onEscapeNotification: (text: string) => void;
}

// ----------------------------------------------------------------------------
// Smart Movement & Collision Avoidance Helper
// ----------------------------------------------------------------------------

export function isPositionColliding(
  x: number,
  z: number,
  colliders: CollisionCollider[],
  genPositions: { x: number; z: number }[],
  radius = 0.75
): boolean {
  for (const c of colliders) {
    if (
      x + radius > c.minX &&
      x - radius < c.maxX &&
      z + radius > c.minZ &&
      z - radius < c.maxZ
    ) {
      return true;
    }
  }

  for (let i = 0; i < Math.min(10, genPositions.length); i++) {
    const g = genPositions[i];
    const distSq = (x - g.x) * (x - g.x) + (z - g.z) * (z - g.z);
    const minDistance = radius + 1.35;
    if (distSq < minDistance * minDistance) {
      return true;
    }
  }

  const maxBound = 60;
  if (Math.abs(x) > maxBound || Math.abs(z) > maxBound) {
    return true;
  }
  return false;
}

/**
 * Intelligent move with wall sliding and collision unstick
 */
export function aiMoveWithCollision(
  currX: number,
  currZ: number,
  targetX: number,
  targetZ: number,
  colliders: CollisionCollider[],
  genPositions: { x: number; z: number }[],
  radius = 0.75
): { x: number; z: number } {
  let finalX = currX;
  let finalZ = currZ;

  // 1. Unstick from colliders if currently inside
  for (const c of colliders) {
    if (
      currX + radius > c.minX &&
      currX - radius < c.maxX &&
      currZ + radius > c.minZ &&
      currZ - radius < c.maxZ
    ) {
      const distLeft = Math.abs(currX - (c.minX - radius - 0.2));
      const distRight = Math.abs(currX - (c.maxX + radius + 0.2));
      const distTop = Math.abs(currZ - (c.minZ - radius - 0.2));
      const distBottom = Math.abs(currZ - (c.maxZ + radius + 0.2));
      const minDist = Math.min(distLeft, distRight, distTop, distBottom);
      if (minDist === distLeft) finalX = c.minX - radius - 0.2;
      else if (minDist === distRight) finalX = c.maxX + radius + 0.2;
      else if (minDist === distTop) finalZ = c.minZ - radius - 0.2;
      else finalZ = c.maxZ + radius + 0.2;
      return { x: finalX, z: finalZ };
    }
  }

  // 2. Unstick from generators
  for (let i = 0; i < Math.min(10, genPositions.length); i++) {
    const pos = genPositions[i];
    const dist = Math.hypot(currX - pos.x, currZ - pos.z);
    const minSafeDist = radius + 1.35;
    if (dist < minSafeDist && dist > 0.001) {
      finalX = pos.x + ((currX - pos.x) / dist) * (minSafeDist + 0.15);
      finalZ = pos.z + ((currZ - pos.z) / dist) * (minSafeDist + 0.15);
      return { x: finalX, z: finalZ };
    }
  }

  // 3. Try full step
  if (!isPositionColliding(targetX, targetZ, colliders, genPositions, radius)) {
    return { x: targetX, z: targetZ };
  }

  // 4. Slide along X
  if (!isPositionColliding(targetX, currZ, colliders, genPositions, radius)) {
    finalX = targetX;
  }
  // 5. Slide along Z
  if (!isPositionColliding(finalX, targetZ, colliders, genPositions, radius)) {
    finalZ = targetZ;
  }

  return { x: finalX, z: finalZ };
}

// ----------------------------------------------------------------------------
// Smart Pathfinding / Steering away from killer & obstacles
// ----------------------------------------------------------------------------

export interface SurvivorRoleAssignment {
  assignedRescuerId: string | null;
  rescueTargetId: string | null;
  assignedHealerId: string | null;
  healTargetId: string | null;
  assignedGateOpenerId: string | null;
  assignedDistractorId: string | null;
  killerTargetId: string | null;
  isKillerOccupied: boolean;
  isGateOpportunity: boolean;
  opportunityReason?: string;
}

export function calculateFleeVector(
  survivor: PlayerState,
  killer: PlayerState,
  teammates: PlayerState[],
  colliders: CollisionCollider[],
  genPositions: { x: number; z: number }[],
  stepDist: number,
  avoidGatePos?: { x: number; z: number } | null
): { x: number; z: number; angle: number } {
  const kdx = survivor.x - killer.x;
  const kdz = survivor.z - killer.z;
  const baseFleeAngle = Math.atan2(kdx, kdz);

  // Test 16 candidate angles around the base flee angle to find the clearest path away from killer, walls, and teammate clusters
  const candidateOffsets = [
    0,
    Math.PI / 8, -Math.PI / 8,
    Math.PI / 4, -Math.PI / 4,
    (3 * Math.PI) / 8, -(3 * Math.PI) / 8,
    Math.PI / 2, -Math.PI / 2,
    (5 * Math.PI) / 8, -(5 * Math.PI) / 8,
    (3 * Math.PI) / 4, -(3 * Math.PI) / 4,
  ];

  let bestAngle = baseFleeAngle;
  let bestScore = -99999;

  for (const offset of candidateOffsets) {
    const testAngle = baseFleeAngle + offset;
    const testX = survivor.x + Math.sin(testAngle) * stepDist;
    const testZ = survivor.z + Math.cos(testAngle) * stepDist;

    // Reject if wall collision
    if (isPositionColliding(testX, testZ, colliders, genPositions, 0.75)) {
      continue;
    }

    // Secondary lookahead (2x step) to avoid dead ends
    const testFarX = survivor.x + Math.sin(testAngle) * (stepDist * 2.2);
    const testFarZ = survivor.z + Math.cos(testAngle) * (stepDist * 2.2);
    const isFarBlocked = isPositionColliding(testFarX, testFarZ, colliders, genPositions, 0.75);

    // Distance from killer
    const distToKiller = Math.hypot(testX - killer.x, testZ - killer.z);

    // Penalty for moving towards teammates (Rule: Prefer routes that do not lead directly toward teammates)
    let teammateCrowdPenalty = 0;
    for (const t of teammates) {
      if (t.id !== survivor.id && t.health !== 'dead' && t.health !== 'escaped') {
        const distToT = Math.hypot(testX - t.x, testZ - t.z);
        if (distToT < 8.0) {
          teammateCrowdPenalty += (8.0 - distToT) * 1.8;
        }
      }
    }

    // E5: If avoidGatePos is provided, heavily penalize moving towards the exit gate so distractor leads killer away!
    let gateCrowdPenalty = 0;
    if (avoidGatePos) {
      const dToGate = Math.hypot(testX - avoidGatePos.x, testZ - avoidGatePos.z);
      if (dToGate < 18.0) {
        gateCrowdPenalty = (18.0 - dToGate) * 2.5;
      }
    }

    let score = distToKiller * 2.5 - Math.abs(offset) * 1.5 - teammateCrowdPenalty - gateCrowdPenalty;
    if (isFarBlocked) {
      score -= 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestAngle = testAngle;
    }
  }

  const targetX = survivor.x + Math.sin(bestAngle) * stepDist;
  const targetZ = survivor.z + Math.cos(bestAngle) * stepDist;
  const moved = aiMoveWithCollision(survivor.x, survivor.z, targetX, targetZ, colliders, genPositions, 0.75);

  return { x: moved.x, z: moved.z, angle: bestAngle };
}

// ----------------------------------------------------------------------------
// Helper: Get available cage for imprisonment (1 survivor strictly per cage)
// ----------------------------------------------------------------------------

export function findBestCage(
  killerPos: { x: number; z: number },
  allPlayers: PlayerState[],
  cages: CageState[]
): { id: number; x: number; z: number } {
  const currentlyCaged = allPlayers.filter(p => p.faction === 'survivor' && p.health === 'caged');
  const unoccupied = cages.filter(cage => {
    const isOccupiedByPlayerId = !!(cage.occupiedPlayerId && currentlyCaged.some(s => s.id === cage.occupiedPlayerId));
    const isOccupiedByAssignment = currentlyCaged.some(s => s.assignedCageId === cage.id);
    const isOccupiedByDistance = currentlyCaged.some(s => Math.hypot(s.x - cage.x, s.z - cage.z) < 4.0);
    return !isOccupiedByPlayerId && !isOccupiedByAssignment && !isOccupiedByDistance;
  });

  if (unoccupied.length > 0) {
    let best = unoccupied[0];
    let maxDist = -1;
    for (const c of unoccupied) {
      const d = Math.hypot(c.x - killerPos.x, c.z - killerPos.z);
      if (d > maxDist) {
        maxDist = d;
        best = c;
      }
    }
    return best;
  }

  let fallback = cages[0] || { id: 0, x: 0, z: 0, occupiedPlayerId: null };
  let maxDist = -1;
  for (const c of cages) {
    const d = Math.hypot(c.x - killerPos.x, c.z - killerPos.z);
    if (d > maxDist) {
      maxDist = d;
      fallback = c;
    }
  }
  return fallback;
}

// ============================================================================
// SURVIVOR AI DECISION SYSTEM
// ============================================================================

export interface SurvivorDecision {
  actionType: 'ESCAPE_KILLER' | 'RESCUE_SURVIVOR' | 'HEAL_SURVIVOR' | 'FINAL_PHASE' | 'REPAIR_GENERATOR';
  targetPos: { x: number; z: number } | null;
  targetId?: string | number | null;
  detail: string;
}

/**
 * Determine dynamic roles for survivors in real-time (G1 Real-Time Decision & E1-E14 Endgame Breakthrough)
 */
export function evaluateSurvivorRoles(
  survivors: PlayerState[],
  killerOrKillers: PlayerState | PlayerState[],
  generators: GeneratorState[],
  exitGates: ExitGateState[],
  gatesArePowered: boolean,
  endgameStallTimer = 0
): SurvivorRoleAssignment {
  const killers = Array.isArray(killerOrKillers) ? killerOrKillers : [killerOrKillers];
  const activeKillers = killers.filter(k => k && k.health !== 'dead');

  const getMinDistToAnyKiller = (pos: { x: number; z: number }): number => {
    if (activeKillers.length === 0) return 999;
    return Math.min(...activeKillers.map(k => Math.hypot(pos.x - k.x, pos.z - k.z)));
  };

  let assignedRescuerId: string | null = null;
  let rescueTargetId: string | null = null;
  let assignedHealerId: string | null = null;
  let healTargetId: string | null = null;
  let assignedGateOpenerId: string | null = null;
  let assignedDistractorId: string | null = null;
  let killerTargetId: string | null = null;
  let isKillerOccupied = false;
  let isGateOpportunity = false;
  let opportunityReason = '';

  const activeGate = exitGates[0];

  // 1. Determine Killer's Current Target & Attention Focus (E4, E11)
  const downedSurvivors = survivors.filter(s => s.health === 'downed');
  const closestDowned = downedSurvivors.sort((a, b) => {
    return getMinDistToAnyKiller(a) - getMinDistToAnyKiller(b);
  })[0];

  if (closestDowned) {
    const distToDowned = getMinDistToAnyKiller(closestDowned);
    if (distToDowned <= 4.0 || closestDowned.isBeingCaged || (closestDowned.cagingProgress || 0) > 0) {
      isKillerOccupied = true;
      killerTargetId = closestDowned.id;
      isGateOpportunity = true;
      opportunityReason = `Killer occupied with downed teammate (${closestDowned.name})`;
    }
  }

  // Check if any killer is in attack cooldown / recovery (E4)
  if (activeKillers.some(k => (k.attackCooldown || 0) > 0.3)) {
    isKillerOccupied = true;
    isGateOpportunity = true;
    if (!opportunityReason) opportunityReason = 'Killer recovering from attack';
  }

  // Check which survivor is closest to killer / actively pursued
  const activeSurvivors = survivors.filter(s => s.health === 'healthy' || s.health === 'injured');
  let closestActiveSurv: PlayerState | null = null;
  let minActiveDist = 999;
  for (const s of activeSurvivors) {
    const d = getMinDistToAnyKiller(s);
    if (d < minActiveDist) {
      minActiveDist = d;
      closestActiveSurv = s;
    }
  }

  if (!isKillerOccupied && closestActiveSurv && minActiveDist <= 14.0) {
    killerTargetId = closestActiveSurv.id;
  }

  // 2. Final Phase Breakthrough & Gate Opportunity Evaluation (E1 - E14)
  if (gatesArePowered && activeGate && !activeGate.isOpen) {
    // E2 & E3: Downed survivor or occupied killer creates immediate gate opportunity
    if (downedSurvivors.length > 0) {
      isGateOpportunity = true;
      if (!opportunityReason) opportunityReason = 'Downed teammate created distraction opportunity';
    }

    // Check distance between killers and gate (E4: Killer moving away from gate / occupied elsewhere)
    const minKillerToGate = activeKillers.length > 0
      ? Math.min(...activeKillers.map(k => Math.hypot(k.x - activeGate.x, k.z - activeGate.z)))
      : 999;
    if (minKillerToGate > 12.0 || isKillerOccupied || (killerTargetId && activeSurvivors.some(s => s.id === killerTargetId && Math.hypot(s.x - activeGate.x, s.z - activeGate.z) > 10.0))) {
      isGateOpportunity = true;
      if (!opportunityReason) opportunityReason = 'Killers drawn away from exit gate';
    }

    // E13: Anti-Stall escalation (If gate remains unopened for extended period, force calculated risk)
    if (endgameStallTimer > 8) {
      isGateOpportunity = true;
      if (!opportunityReason) opportunityReason = `Anti-stall breakthrough initiative (${Math.floor(endgameStallTimer)}s)`;
    }

    // E5, E8, E10: Select Gate Opener & Distractor
    if (activeSurvivors.length > 0) {
      // Sort candidates for Gate Opener (E10: Closest to gate, not currently targeted by killer)
      const candidates = [...activeSurvivors].sort((a, b) => {
        const aIsTarget = a.id === killerTargetId;
        const bIsTarget = b.id === killerTargetId;
        if (aIsTarget !== bIsTarget) return aIsTarget ? 1 : -1;

        const dAGate = Math.hypot(a.x - activeGate.x, a.z - activeGate.z);
        const dBGate = Math.hypot(b.x - activeGate.x, b.z - activeGate.z);
        return dAGate - dBGate;
      });

      assignedGateOpenerId = candidates[0].id;

      // E5: The survivor targeted by killer or secondary candidate becomes distractor
      if (candidates.length > 1) {
        if (killerTargetId && candidates.some(c => c.id === killerTargetId)) {
          assignedDistractorId = killerTargetId;
        } else {
          // If killer is camping gate and no one targeted, pick non-opener as distractor bait
          assignedDistractorId = candidates[candidates.length - 1].id;
        }
      }
    }

    // E7: Gate opening takes priority over rescue in endgame unless >= 3 active survivors
    if (activeSurvivors.length >= 3) {
      const cagedSurvivors = survivors.filter(s => s.health === 'caged');
      if (cagedSurvivors.length > 0) {
        const cTarget = cagedSurvivors.sort((a, b) => a.cageTimer - b.cageTimer)[0];
        const otherEligible = activeSurvivors.filter(s => s.id !== assignedGateOpenerId && s.id !== assignedDistractorId);
        if (otherEligible.length > 0) {
          assignedRescuerId = otherEligible[0].id;
          rescueTargetId = cTarget.id;
        }
      }
    }
  } else if (!gatesArePowered) {
    // Normal phase: Rescue caged or downed survivors, and Heal injured survivors (H1-H10 Rule)
    const needsRescue = survivors.filter(s => s.health === 'caged' || s.health === 'downed');
    if (needsRescue.length > 0) {
      const target = needsRescue.sort((a, b) => {
        if (a.health === 'caged' && b.health === 'caged') return a.cageTimer - b.cageTimer;
        if (a.health === 'caged') return -1;
        if (b.health === 'caged') return 1;
        return 0;
      })[0];
      rescueTargetId = target.id;

      const eligibleRescuers = survivors.filter(s => {
        if (s.id === target.id) return false;
        if (s.health !== 'healthy' && s.health !== 'injured') return false;
        const distToKiller = getMinDistToAnyKiller(s);
        return distToKiller > 10.0;
      });

      if (eligibleRescuers.length > 0) {
        eligibleRescuers.sort((a, b) => {
          const dA = Math.hypot(a.x - target.x, a.z - target.z);
          const dB = Math.hypot(b.x - target.x, b.z - target.z);
          return dA - dB;
        });
        assignedRescuerId = eligibleRescuers[0].id;
      }
    }

    // H1-H10: Evaluate Healing priority (Rescuer healing rescued injured teammate, or healing nearby injured teammates)
    const injuredSurvivors = survivors.filter(s => s.health === 'injured');
    if (injuredSurvivors.length > 0) {
      // Find injured survivor needing healing, prioritizing recently rescued survivors
      const targetInjured = [...injuredSurvivors].sort((a, b) => {
        const aRescued = a.wasRescuedFromCage ? 1 : 0;
        const bRescued = b.wasRescuedFromCage ? 1 : 0;
        if (aRescued !== bRescued) return bRescued - aRescued;
        return (b.healProgress || 0) - (a.healProgress || 0);
      })[0];

      if (targetInjured) {
        // Find safe healer not actively chased by killer and not currently assigned to active rescue
        const eligibleHealers = survivors.filter(s => {
          if (s.id === targetInjured.id) return false;
          if (s.health !== 'healthy' && s.health !== 'injured') return false;
          if (assignedRescuerId === s.id && rescueTargetId && needsRescue.length > 0) return false;
          const distToKiller = getMinDistToAnyKiller(s);
          // Safe to heal if killer is not actively chasing healer (dist > 8m and not directly pursued)
          return distToKiller > 8.0 && s.id !== killerTargetId;
        });

        if (eligibleHealers.length > 0) {
          eligibleHealers.sort((a, b) => {
            const dA = Math.hypot(a.x - targetInjured.x, a.z - targetInjured.z);
            const dB = Math.hypot(b.x - targetInjured.x, b.z - targetInjured.z);
            return dA - dB;
          });
          assignedHealerId = eligibleHealers[0].id;
          healTargetId = targetInjured.id;
        }
      }
    }
  }

  return {
    assignedRescuerId,
    rescueTargetId,
    assignedHealerId,
    healTargetId,
    assignedGateOpenerId,
    assignedDistractorId,
    killerTargetId,
    isKillerOccupied,
    isGateOpportunity,
    opportunityReason,
  };
}

export interface TargetPlayerUpdate {
  targetId: string;
  rescueProgress?: number;
  healProgress?: number;
  health?: HealthState;
  wasRescuedFromCage?: boolean;
  hitBoostTime?: number;
  assignedCageId?: number | null;
  jackRescuedWindow?: number;
  deepInjury?: boolean;
  erikSkillAvailable?: boolean;
}

/**
 * Execute Survivor AI tick following strict Action 1-5 priority & E1-E14 Endgame Breakthrough
 */
export function updateSurvivorAI(
  survivor: PlayerState,
  ctx: AIGameContext,
  roleAssignment: SurvivorRoleAssignment
): {
  updatedSurvivor: PlayerState;
  decision: SurvivorDecision;
  targetPlayerUpdate?: TargetPlayerUpdate;
} {
  let s = { ...survivor };
  const pMesh = ctx.playerMeshes[s.id];

  // Active timer decrements based on tick delta (prevents hitBoostTime and buff deadlock)
  s.hitBoostTime = Math.max(0, (s.hitBoostTime || 0) - ctx.delta);
  s.frostbiteTime = Math.max(0, (s.frostbiteTime || 0) - ctx.delta);
  s.elenaBuffTime = Math.max(0, (s.elenaBuffTime || 0) - ctx.delta);
  s.tariqStealthTime = Math.max(0, (s.tariqStealthTime || 0) - ctx.delta);
  s.tariqSpeedBoostTime = Math.max(0, (s.tariqSpeedBoostTime || 0) - ctx.delta);
  s.betrayedTeammateTime = Math.max(0, (s.betrayedTeammateTime || 0) - ctx.delta);
  s.jackBuffTime = Math.max(0, (s.jackBuffTime || 0) - ctx.delta);
  s.vikingBuffTime = Math.max(0, (s.vikingBuffTime || 0) - ctx.delta);
  s.satoBuffTime = Math.max(0, (s.satoBuffTime || 0) - ctx.delta);
  s.skillCooldown = Math.max(0, (s.skillCooldown || 0) - ctx.delta);
  s.skillActiveTime = Math.max(0, (s.skillActiveTime || 0) - ctx.delta);

  // Recalculate speed dynamically during hit boost or active buffs
  if (s.hitBoostTime > 0) {
    s.speed = 8.0;
  } else {
    let survBase = 5.0;
    if (s.frostbiteTime > 0) survBase *= 0.85;
    if (s.vikingBuffTime > 0) survBase *= 1.5;
    if (s.tariqSpeedBoostTime > 0) survBase *= 1.35;
    s.speed = survBase;
  }

  // G5: Death / Game Over / Inactive State
  if (s.health === 'caged' || s.health === 'dead' || s.health === 'escaped' || s.health === 'downed') {
    if (pMesh?.userData?.updateMovementPose) {
      pMesh.userData.updateMovementPose(ctx.delta, false, 'idle', s.health);
    } else if (pMesh?.userData?.setPose) {
      pMesh.userData.setPose(s.health === 'downed' || s.health === 'caged' || s.health === 'dead' ? 'ko' : 'front');
    }
    return {
      updatedSurvivor: s,
      decision: {
        actionType: 'ESCAPE_KILLER',
        targetPos: null,
        detail: `Inactive (${s.health})`,
      },
    };
  }

  const activeKillers = ctx.allPlayers.filter(p => p.faction === 'killer' && p.health !== 'dead');
  if (activeKillers.length === 0) {
    return {
      updatedSurvivor: s,
      decision: { actionType: 'REPAIR_GENERATOR', targetPos: null, detail: 'No killer present' },
    };
  }

  // Find nearest killer to this survivor
  let killer = activeKillers[0];
  let distToKiller = Math.hypot(s.x - killer.x, s.z - killer.z);
  for (let i = 1; i < activeKillers.length; i++) {
    const d = Math.hypot(s.x - activeKillers[i].x, s.z - activeKillers[i].z);
    if (d < distToKiller) {
      distToKiller = d;
      killer = activeKillers[i];
    }
  }
  const otherSurvivors = ctx.allPlayers.filter(p => p.faction === 'survivor' && p.id !== s.id);
  const completedGens = ctx.generators.filter(g => g.isCompleted && g.isTargetGen).length;
  const gatesArePowered = completedGens >= 5;
  const activeGate = ctx.exitGates[0];

  // ==========================================================================
  // FINAL PHASE (ENDGAME): E1-E14 BREAKTHROUGH & SACRIFICE SYSTEM
  // ==========================================================================
  if (gatesArePowered && activeGate) {
    const isNearGate = Math.hypot(s.x - activeGate.x, s.z - activeGate.z) <= 6.5;

    // E14.5: Gate is open -> All survivors rush to gate and escape!
    if (activeGate.isOpen) {
      if (!isNearGate) {
        const angle = Math.atan2(activeGate.x - s.x, activeGate.z - s.z);
        s.rotationY = angle;
        const targetX = s.x + Math.sin(angle) * s.speed * ctx.delta;
        const targetZ = s.z + Math.cos(angle) * s.speed * ctx.delta;
        const moved = aiMoveWithCollision(s.x, s.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
        s.x = moved.x;
        s.z = moved.z;

        if (pMesh?.userData?.updateMovementPose) {
          pMesh.userData.updateMovementPose(ctx.delta, true, 1, s.health);
        }
      } else {
        s.health = 'escaped';
        if (pMesh) pMesh.visible = false;
        sound.playEscapeSound();
        ctx.onEscapeNotification(`${s.name}已逃離遊戲`);
      }

      return {
        updatedSurvivor: s,
        decision: {
          actionType: 'FINAL_PHASE',
          targetPos: { x: activeGate.x, z: activeGate.z },
          detail: 'Escaping through open exit gate!',
        },
      };
    }

    // Gate is closed: Execute Endgame Role Decisions (E1-E14)
    const isOpener = roleAssignment.assignedGateOpenerId === s.id;
    const isDistractor = roleAssignment.assignedDistractorId === s.id;

    // E9 & E12: Check if Killer is directly attacking/chasing this specific survivor in close quarters
    const killerDirectlyTargetingMe = roleAssignment.killerTargetId === s.id || (distToKiller < 4.2 && !roleAssignment.isKillerOccupied);

    // E12: Short Commitment to Gate — If this survivor is Gate Opener, DO NOT flee just because killer is visible!
    // Only flee if killer is directly targeting the opener within close strike danger
    if (isOpener && !killerDirectlyTargetingMe) {
      // Approach gate and open!
      if (!isNearGate) {
        const angle = Math.atan2(activeGate.x - s.x, activeGate.z - s.z);
        s.rotationY = angle;
        const targetX = s.x + Math.sin(angle) * s.speed * ctx.delta;
        const targetZ = s.z + Math.cos(angle) * s.speed * ctx.delta;
        const moved = aiMoveWithCollision(s.x, s.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
        s.x = moved.x;
        s.z = moved.z;

        if (pMesh?.userData?.updateMovementPose) {
          pMesh.userData.updateMovementPose(ctx.delta, true, 1, s.health);
        }
      } else {
        // At gate: actively opening
        if (pMesh?.userData?.updateMovementPose) {
          pMesh.userData.updateMovementPose(ctx.delta, false, 'idle', s.health);
        }
      }

      return {
        updatedSurvivor: s,
        decision: {
          actionType: 'FINAL_PHASE',
          targetPos: { x: activeGate.x, z: activeGate.z },
          detail: `⚡ 把握機會開啟大門 [ ${Math.floor(activeGate.progress)}% ] (${roleAssignment.opportunityReason || '牽制推進'})`,
        },
      };
    }

    // E5: Distractor role behavior — Pull killer AWAY from the exit gate!
    if (isDistractor && killerDirectlyTargetingMe) {
      // Use survivor skills if available during chase
      if (s.characterId === 'erik' && s.health === 'injured' && s.erikSkillAvailable && s.skillCooldown <= 0) {
        const res = castErikSkill(s, ctx.allPlayers);
        s = res.updatedPlayers.find(p => p.id === s.id) || s;
        sound.playSkillSound();
      } else if (s.characterId === 'tariq' && s.skillCooldown <= 0) {
        const check = checkTariqSkillCondition(s, ctx.allPlayers);
        if (check.canActivate) {
          const res = castTariqBetrayalSkill(s, ctx.allPlayers);
          s = res.updatedPlayers.find(p => p.id === s.id) || s;
          sound.playSkillSound();
        }
      } else if (s.characterId === 'kento' && (s.kentoFearScreamTime || 0) > 0 && s.skillCooldown <= 0) {
        const check = checkKentoSkillCondition(s, s.kentoFearScreamTime || 0);
        if (check.canActivate) {
          const res = castKentoSurgeSkill(s, ctx.allPlayers, s.kentoFearScreamTime || 0);
          s = res.updatedPlayers.find(p => p.id === s.id) || s;
          sound.playSkillSound();
        }
      }

      // Flee away from killer AND away from gate!
      const stepDist = s.speed * ctx.delta;
      const flee = calculateFleeVector(
        s,
        killer,
        otherSurvivors,
        ctx.mapColliders,
        ctx.genPositions,
        stepDist,
        { x: activeGate.x, z: activeGate.z }
      );
      const moved = aiMoveWithCollision(s.x, s.z, flee.x, flee.z, ctx.mapColliders, ctx.genPositions, 0.75);
      s.x = moved.x;
      s.z = moved.z;
      s.rotationY = flee.angle;

      if (pMesh?.userData?.updateMovementPose) {
        const dx = moved.x - survivor.x;
        pMesh.userData.updateMovementPose(ctx.delta, true, dx >= 0 ? 1 : -1, s.health);
      }

      return {
        updatedSurvivor: s,
        decision: {
          actionType: 'ESCAPE_KILLER',
          targetPos: { x: flee.x, z: flee.z },
          detail: `🎯 牽制拉扯殺手遠離大門 (Dist: ${distToKiller.toFixed(1)}m)`,
        },
      };
    }

    // E5: If Distractor and killer is camping gate without chasing anyone, move in to bait / draw aggro
    if (isDistractor && !killerDirectlyTargetingMe && (ctx.endgameStallTimer || 0) > 6) {
      // Bait position: 10m from killer on opposite side from gate
      const baitAngle = Math.atan2(killer.x - activeGate.x, killer.z - activeGate.z);
      const baitX = killer.x + Math.sin(baitAngle) * 9.0;
      const baitZ = killer.z + Math.cos(baitAngle) * 9.0;
      const dToBait = Math.hypot(baitX - s.x, baitZ - s.z);

      if (dToBait > 2.0) {
        const angle = Math.atan2(baitX - s.x, baitZ - s.z);
        s.rotationY = angle;
        const targetX = s.x + Math.sin(angle) * s.speed * ctx.delta;
        const targetZ = s.z + Math.cos(angle) * s.speed * ctx.delta;
        const moved = aiMoveWithCollision(s.x, s.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
        s.x = moved.x;
        s.z = moved.z;
        if (pMesh?.userData?.updateMovementPose) {
          pMesh.userData.updateMovementPose(ctx.delta, true, 1, s.health);
        }
      }

      return {
        updatedSurvivor: s,
        decision: {
          actionType: 'FINAL_PHASE',
          targetPos: { x: baitX, z: baitZ },
          detail: '🎯 主動佯攻誘敵，吸引守門殺手仇恨',
        },
      };
    }

    // E8 & E10: Supporting survivors position on flank near gate, ready to take over gate opening or body-block
    if (roleAssignment.assignedRescuerId === s.id && roleAssignment.rescueTargetId) {
      const targetPlayer = ctx.allPlayers.find(p => p.id === roleAssignment.rescueTargetId);
      if (targetPlayer && targetPlayer.health === 'caged') {
        const dTarget = Math.hypot(targetPlayer.x - s.x, targetPlayer.z - s.z);
        let targetPlayerUpdate: TargetPlayerUpdate | undefined;

        if (dTarget > 3.2) {
          const angle = Math.atan2(targetPlayer.x - s.x, targetPlayer.z - s.z);
          s.rotationY = angle;
          const targetX = s.x + Math.sin(angle) * s.speed * ctx.delta;
          const targetZ = s.z + Math.cos(angle) * s.speed * ctx.delta;
          const moved = aiMoveWithCollision(s.x, s.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
          s.x = moved.x;
          s.z = moved.z;
          if (pMesh?.userData?.updateMovementPose) {
            pMesh.userData.updateMovementPose(ctx.delta, true, 1, s.health);
          }
        } else {
          const currentRescueProg = targetPlayer.rescueProgress || 0;
          const nextRescueProg = Math.min(100, currentRescueProg + (ctx.delta / 1.5) * 100);
          targetPlayer.rescueProgress = nextRescueProg;

          if (nextRescueProg >= 100) {
            targetPlayer.health = 'injured';
            targetPlayer.rescueProgress = 0;
            targetPlayer.healProgress = 0;
            targetPlayer.wasRescuedFromCage = true;
            targetPlayer.hitBoostTime = 2.0;
            let freedCageId: number | null = null;
            if (targetPlayer.assignedCageId !== undefined && targetPlayer.assignedCageId !== null) {
              freedCageId = targetPlayer.assignedCageId;
              const freedCage = ctx.cages.find(c => c.id === freedCageId);
              if (freedCage) freedCage.occupiedPlayerId = null;
              targetPlayer.assignedCageId = null;
            }
            if (targetPlayer.characterId === 'jack') targetPlayer.jackRescuedWindow = 30;
            const tMesh = ctx.playerMeshes[targetPlayer.id];
            if (tMesh?.userData?.setPose) tMesh.userData.setPose('front');
            sound.playSkillSound();

            targetPlayerUpdate = {
              targetId: targetPlayer.id,
              health: 'injured',
              rescueProgress: 0,
              healProgress: 0,
              wasRescuedFromCage: true,
              hitBoostTime: 2.0,
              assignedCageId: null,
              jackRescuedWindow: targetPlayer.characterId === 'jack' ? 30 : undefined,
            };
          } else {
            targetPlayerUpdate = {
              targetId: targetPlayer.id,
              rescueProgress: nextRescueProg,
            };
          }
        }

        return {
          updatedSurvivor: s,
          decision: {
            actionType: 'RESCUE_SURVIVOR',
            targetPos: { x: targetPlayer.x, z: targetPlayer.z },
            targetId: targetPlayer.id,
            detail: `Rescuing ${targetPlayer.name} during endgame`,
          },
          targetPlayerUpdate,
        };
      }
    }

    // Backup opener / gate flanker
    const safeX = activeGate.x + (s.id.charCodeAt(s.id.length - 1) % 2 === 0 ? 7 : -7);
    const safeZ = activeGate.z + (activeGate.z > 0 ? -8 : 8);
    const dSafe = Math.hypot(safeX - s.x, safeZ - s.z);

    if (dSafe > 2.0) {
      const angle = Math.atan2(safeX - s.x, safeZ - s.z);
      s.rotationY = angle;
      const targetX = s.x + Math.sin(angle) * s.speed * ctx.delta;
      const targetZ = s.z + Math.cos(angle) * s.speed * ctx.delta;
      const moved = aiMoveWithCollision(s.x, s.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
      s.x = moved.x;
      s.z = moved.z;
      if (pMesh?.userData?.updateMovementPose) {
        pMesh.userData.updateMovementPose(ctx.delta, true, 1, s.health);
      }
    } else {
      if (pMesh?.userData?.updateMovementPose) {
        pMesh.userData.updateMovementPose(ctx.delta, false, 'idle', s.health);
      }
    }

    return {
      updatedSurvivor: s,
      decision: {
        actionType: 'FINAL_PHASE',
        targetPos: { x: safeX, z: safeZ },
        detail: '側翼掩護，隨時替補開門 (Backup Gate Opener)',
      },
    };
  }

  // ==========================================================================
  // REGULAR PHASE PRIORITY 1: ACTION 3 — ESCAPE KILLER
  // ==========================================================================
  const isChased = distToKiller < 14.0 || (distToKiller < 20.0 && (s.hitBoostTime || 0) > 0);

  if (isChased) {
    if (s.characterId === 'erik' && s.health === 'injured' && s.erikSkillAvailable && s.skillCooldown <= 0) {
      const res = castErikSkill(s, ctx.allPlayers);
      s = res.updatedPlayers.find(p => p.id === s.id) || s;
      sound.playSkillSound();
    } else if (s.characterId === 'tariq' && s.skillCooldown <= 0) {
      const check = checkTariqSkillCondition(s, ctx.allPlayers);
      if (check.canActivate) {
        const res = castTariqBetrayalSkill(s, ctx.allPlayers);
        s = res.updatedPlayers.find(p => p.id === s.id) || s;
        sound.playSkillSound();
      }
    } else if (s.characterId === 'kento' && (s.kentoFearScreamTime || 0) > 0 && s.skillCooldown <= 0) {
      const check = checkKentoSkillCondition(s, s.kentoFearScreamTime || 0);
      if (check.canActivate) {
        const res = castKentoSurgeSkill(s, ctx.allPlayers, s.kentoFearScreamTime || 0);
        s = res.updatedPlayers.find(p => p.id === s.id) || s;
        sound.playSkillSound();
      }
    }

    const stepDist = s.speed * ctx.delta;
    const flee = calculateFleeVector(s, killer, otherSurvivors, ctx.mapColliders, ctx.genPositions, stepDist);
    const moved = aiMoveWithCollision(s.x, s.z, flee.x, flee.z, ctx.mapColliders, ctx.genPositions, 0.75);

    s.x = moved.x;
    s.z = moved.z;
    s.rotationY = flee.angle;

    if (pMesh?.userData?.updateMovementPose) {
      const dx = moved.x - survivor.x;
      pMesh.userData.updateMovementPose(ctx.delta, true, dx >= 0 ? 1 : -1, s.health);
    }

    return {
      updatedSurvivor: s,
      decision: {
        actionType: 'ESCAPE_KILLER',
        targetPos: { x: flee.x, z: flee.z },
        detail: `Fleeing from killer (Dist: ${distToKiller.toFixed(1)}m)`,
      },
    };
  }

  // ==========================================================================
  // REGULAR PHASE PRIORITY 2: ACTION 4 — RESCUE IMPRISONED / DOWNED SURVIVOR
  // ==========================================================================
  if (roleAssignment.assignedRescuerId === s.id && roleAssignment.rescueTargetId) {
    const targetPlayer = ctx.allPlayers.find(p => p.id === roleAssignment.rescueTargetId);
    if (targetPlayer && (targetPlayer.health === 'caged' || targetPlayer.health === 'downed')) {
      const dTarget = Math.hypot(targetPlayer.x - s.x, targetPlayer.z - s.z);
      let targetPlayerUpdate: TargetPlayerUpdate | undefined;

      if (dTarget > 3.2) {
        const angle = Math.atan2(targetPlayer.x - s.x, targetPlayer.z - s.z);
        s.rotationY = angle;
        const targetX = s.x + Math.sin(angle) * s.speed * ctx.delta;
        const targetZ = s.z + Math.cos(angle) * s.speed * ctx.delta;
        const moved = aiMoveWithCollision(s.x, s.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
        s.x = moved.x;
        s.z = moved.z;

        if (pMesh?.userData?.updateMovementPose) {
          const dx = moved.x - survivor.x;
          pMesh.userData.updateMovementPose(ctx.delta, true, dx >= 0 ? 1 : -1, s.health);
        }
      } else {
        if (pMesh?.userData?.updateMovementPose) {
          pMesh.userData.updateMovementPose(ctx.delta, false, 'idle', s.health);
        }

        if (targetPlayer.health === 'caged') {
          const currentRescueProg = targetPlayer.rescueProgress || 0;
          const nextRescueProg = Math.min(100, currentRescueProg + (ctx.delta / 1.5) * 100);
          targetPlayer.rescueProgress = nextRescueProg;

          if (nextRescueProg >= 100) {
            targetPlayer.health = 'injured';
            // 保留上一次在監牢被救出時的剩餘獻祭時間 (不重置為 90 秒)
            targetPlayer.rescueProgress = 0;
            targetPlayer.healProgress = 0;
            targetPlayer.wasRescuedFromCage = true;
            targetPlayer.hitBoostTime = 2.0;
            let freedCageId: number | null = null;
            if (targetPlayer.assignedCageId !== undefined && targetPlayer.assignedCageId !== null) {
              freedCageId = targetPlayer.assignedCageId;
              const freedCage = ctx.cages.find(c => c.id === freedCageId);
              if (freedCage) freedCage.occupiedPlayerId = null;
              targetPlayer.assignedCageId = null;
            }
            if (targetPlayer.characterId === 'jack') targetPlayer.jackRescuedWindow = 30;
            const tMesh = ctx.playerMeshes[targetPlayer.id];
            if (tMesh?.userData?.setPose) tMesh.userData.setPose('front');
            sound.playSkillSound();

            targetPlayerUpdate = {
              targetId: targetPlayer.id,
              health: 'injured',
              rescueProgress: 0,
              healProgress: 0,
              wasRescuedFromCage: true,
              hitBoostTime: 2.0,
              assignedCageId: null,
              jackRescuedWindow: targetPlayer.characterId === 'jack' ? 30 : undefined,
            };
          } else {
            targetPlayerUpdate = {
              targetId: targetPlayer.id,
              rescueProgress: nextRescueProg,
            };
          }
        } else if (targetPlayer.health === 'downed') {
          const healRate = targetPlayer.deepInjury ? (100 / 24) : (100 / 16);
          const nextProg = Math.min(100, (targetPlayer.healProgress || 0) + healRate * ctx.delta);
          targetPlayer.healProgress = nextProg;

          if (nextProg >= 100) {
            targetPlayer.health = 'injured';
            targetPlayer.healProgress = 0;
            targetPlayer.deepInjury = false;

            targetPlayerUpdate = {
              targetId: targetPlayer.id,
              health: 'injured',
              healProgress: 0,
              deepInjury: false,
            };
          } else {
            targetPlayerUpdate = {
              targetId: targetPlayer.id,
              healProgress: nextProg,
            };
          }
        }
      }

      return {
        updatedSurvivor: s,
        decision: {
          actionType: 'RESCUE_SURVIVOR',
          targetPos: { x: targetPlayer.x, z: targetPlayer.z },
          targetId: targetPlayer.id,
          detail: `Rescuing ${targetPlayer.name} (Dist: ${dTarget.toFixed(1)}m)`,
        },
        targetPlayerUpdate,
      };
    }
  }

  // ==========================================================================
  // REGULAR PHASE PRIORITY 2.5: H1-H10 — HEAL RESCUED / INJURED SURVIVOR
  // Rule: After rescue, if rescued survivor is injured, HEALING > GENERATOR REPAIR.
  // Proactively checks health, approaches injured survivor, and heals them.
  // ==========================================================================
  // Check if this survivor should heal an injured teammate
  let healTarget: PlayerState | null = null;

  // Case A: Assigned healer from role evaluation
  if (roleAssignment.assignedHealerId === s.id && roleAssignment.healTargetId) {
    const assignedTarget = ctx.allPlayers.find(p => p.id === roleAssignment.healTargetId);
    if (assignedTarget && assignedTarget.health === 'injured') {
      healTarget = assignedTarget;
    }
  }

  // Case B: Rescuer immediately checking rescued teammate in close proximity (H1, H2, H3, H8)
  if (!healTarget) {
    const nearbyInjured = ctx.allPlayers.filter(
      p => p.faction === 'survivor' && p.id !== s.id && p.health === 'injured'
    );
    if (nearbyInjured.length > 0) {
      // Prioritize recently rescued teammate within 10m
      const rescuedNearby = nearbyInjured.find(p => p.wasRescuedFromCage && Math.hypot(p.x - s.x, p.z - s.z) < 10.0);
      if (rescuedNearby) {
        healTarget = rescuedNearby;
      } else {
        // Any nearby injured teammate within 6m
        const closestInjured = nearbyInjured
          .map(p => ({ player: p, dist: Math.hypot(p.x - s.x, p.z - s.z) }))
          .sort((a, b) => a.dist - b.dist)[0];
        if (closestInjured && closestInjured.dist <= 6.0) {
          healTarget = closestInjured.player;
        }
      }
    }
  }

  // H4, H5, H9: Killer threat check during healing
  // If killer is actively chasing this survivor, Action 3 takes precedence (already handled above).
  // If killer is approaching within dangerous proximity (< 6.5m) and moving towards healer, break off.
  const killerApproachingTooClose = distToKiller < 6.5;

  if (healTarget && healTarget.health === 'injured' && !killerApproachingTooClose) {
    const dTarget = Math.hypot(healTarget.x - s.x, healTarget.z - s.z);
    let targetPlayerUpdate: TargetPlayerUpdate | undefined;

    if (dTarget > 3.0) {
      // Approach injured teammate to heal
      const angle = Math.atan2(healTarget.x - s.x, healTarget.z - s.z);
      s.rotationY = angle;
      const targetX = s.x + Math.sin(angle) * s.speed * ctx.delta;
      const targetZ = s.z + Math.cos(angle) * s.speed * ctx.delta;
      const moved = aiMoveWithCollision(s.x, s.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
      s.x = moved.x;
      s.z = moved.z;

      if (pMesh?.userData?.updateMovementPose) {
        const dx = moved.x - survivor.x;
        pMesh.userData.updateMovementPose(ctx.delta, true, dx >= 0 ? 1 : -1, s.health);
      }
    } else {
      // At healing range: channel healing
      if (pMesh?.userData?.updateMovementPose) {
        pMesh.userData.updateMovementPose(ctx.delta, false, 'idle', s.health);
      }

      // Check Jack's skill (Battlefield Grit & Repair increases healing rate)
      let healMultiplier = 1.0;
      if (s.characterId === 'jack' && s.jackBuffTime && s.jackBuffTime > 0) {
        healMultiplier = 1.1; // +10% healing speed
      }

      const healRate = (healTarget.deepInjury ? (100 / 24) : (100 / 16)) * healMultiplier;
      const nextHealProg = Math.min(100, (healTarget.healProgress || 0) + healRate * ctx.delta);
      healTarget.healProgress = nextHealProg;

      // H6: Healing completion
      if (nextHealProg >= 100) {
        healTarget.health = 'healthy';
        healTarget.healProgress = 0;
        healTarget.deepInjury = false;
        healTarget.wasRescuedFromCage = false; // Reset rescued flag
        healTarget.erikSkillAvailable = true; // Erik recharged upon returning to healthy
        sound.playSkillSound();

        targetPlayerUpdate = {
          targetId: healTarget.id,
          health: 'healthy',
          healProgress: 0,
          deepInjury: false,
          wasRescuedFromCage: false,
          erikSkillAvailable: true,
        };
      } else {
        targetPlayerUpdate = {
          targetId: healTarget.id,
          healProgress: nextHealProg,
        };
      }
    }

    return {
      updatedSurvivor: s,
      decision: {
        actionType: 'HEAL_SURVIVOR',
        targetPos: { x: healTarget.x, z: healTarget.z },
        targetId: healTarget.id,
        detail: `🩹 正在包紮治療隊友 ${healTarget.name} [ ${Math.floor(healTarget.healProgress || 0)}% ] (Dist: ${dTarget.toFixed(1)}m)`,
      },
      targetPlayerUpdate,
    };
  }

  // ==========================================================================
  // REGULAR PHASE PRIORITY 3: ACTION 1/2 — FIND AND REPAIR GENERATOR
  // ==========================================================================
  const incompleteTargetGens = ctx.generators.filter(g => !g.isCompleted && g.isTargetGen);

  if (incompleteTargetGens.length > 0) {
    let bestGen = incompleteTargetGens[0];
    let bestGenScore = -99999;

    for (const gen of incompleteTargetGens) {
      const dToGen = Math.hypot(gen.x - s.x, gen.z - s.z);
      const dGenToKiller = Math.hypot(gen.x - killer.x, gen.z - killer.z);
      const repairers = gen.repairingCount || 0;

      // Higher score: closer to survivor, farther from killer, not overcrowded
      let score = (60 - dToGen) * 1.5 + dGenToKiller * 2.0 - (repairers >= 2 ? 35 : 0);
      if (score > bestGenScore) {
        bestGenScore = score;
        bestGen = gen;
      }
    }

    const dGen = Math.hypot(bestGen.x - s.x, bestGen.z - s.z);

    if (dGen > 2.4) {
      // Move towards generator
      const angle = Math.atan2(bestGen.x - s.x, bestGen.z - s.z);
      s.rotationY = angle;
      const targetX = s.x + Math.sin(angle) * s.speed * ctx.delta;
      const targetZ = s.z + Math.cos(angle) * s.speed * ctx.delta;
      const moved = aiMoveWithCollision(s.x, s.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
      s.x = moved.x;
      s.z = moved.z;

      if (pMesh?.userData?.updateMovementPose) {
        const dx = moved.x - survivor.x;
        pMesh.userData.updateMovementPose(ctx.delta, true, dx >= 0 ? 1 : -1, s.health);
      }
    } else {
      // Actively repairing at generator
      if (pMesh?.userData?.updateMovementPose) {
        pMesh.userData.updateMovementPose(ctx.delta, false, 'idle', s.health);
      }

      // Check skill usage while repairing (e.g. Jack or Kento)
      if (s.characterId === 'jack' && s.health === 'injured' && s.skillCooldown <= 0) {
        const check = checkJackSkillCondition(s);
        if (check.canActivate) {
          const res = castJackSkill(s, ctx.allPlayers);
          s = res.updatedPlayers.find(p => p.id === s.id) || s;
          sound.playSkillSound();
        }
      }
    }

    return {
      updatedSurvivor: s,
      decision: {
        actionType: 'REPAIR_GENERATOR',
        targetPos: { x: bestGen.x, z: bestGen.z },
        targetId: bestGen.id,
        detail: `Repairing generator #${bestGen.id + 1} [ ${Math.floor(bestGen.progress)}% ] (Dist: ${dGen.toFixed(1)}m)`,
      },
    };
  }

  // Idle fallback
  if (pMesh?.userData?.updateMovementPose) {
    pMesh.userData.updateMovementPose(ctx.delta, false, 'idle', s.health);
  }
  return {
    updatedSurvivor: s,
    decision: {
      actionType: 'REPAIR_GENERATOR',
      targetPos: null,
      detail: 'Idle waiting for objectives',
    },
  };
}

// ============================================================================
// KILLER AI DECISION SYSTEM
// ============================================================================

export interface KillerHitResult {
  survivorId: string;
  newHealth: HealthState;
  deepInjury: boolean;
  message?: string;
}

export interface KillerDecision {
  moveType: 'HANDLE_DOWNED_SURVIVOR' | 'FINAL_PHASE_DEFENSE' | 'CHASE_SURVIVOR' | 'DAMAGE_GENERATOR' | 'PATROL_SEARCH';
  targetPos: { x: number; z: number } | null;
  targetId?: string | number | null;
  detail: string;
}

/**
 * Execute Killer AI tick following strict Moves 1-5 priority
 */
export function updateKillerAI(
  killer: PlayerState,
  ctx: AIGameContext
): {
  updatedKiller: PlayerState;
  decision: KillerDecision;
  hitResult?: KillerHitResult | null;
  hitSurvivorId?: string | null;
  cagedSurvivorId?: string | null;
} {
  let k = { ...killer };
  const pMesh = ctx.playerMeshes[k.id];

  // G5: Game Over / Inactive
  if (k.health === 'dead') {
    return {
      updatedKiller: k,
      decision: { moveType: 'PATROL_SEARCH', targetPos: null, detail: 'Inactive' },
    };
  }

  // Active timer decrements based on tick delta (prevents cooldown deadlock)
  k.attackCooldown = Math.max(0, (k.attackCooldown || 0) - ctx.delta);
  k.skillCooldown = Math.max(0, (k.skillCooldown || 0) - ctx.delta);
  k.berserkTime = Math.max(0, (k.berserkTime || 0) - ctx.delta);

  const survivors = ctx.allPlayers.filter(p => p.faction === 'survivor');
  const completedGens = ctx.generators.filter(g => g.isCompleted && g.isTargetGen).length;
  const gatesArePowered = completedGens >= 5;
  const activeGate = ctx.exitGates[0];

  // ==========================================================================
  // PRIORITY 1: MOVE 3 — HANDLE DOWNED SURVIVOR
  // Condition: Downed survivor exists, is not being caged by another killer, and is close (<18m) or no immediate threat
  // ==========================================================================
  const activeSurvivorsNearby = survivors.filter(
    s => (s.health === 'healthy' || s.health === 'injured') && Math.hypot(s.x - k.x, s.z - k.z) < 12.0
  );

  const availableDowned = survivors.filter(
    s => s.health === 'downed' && (!s.isBeingCaged || s.cagedByKillerId === k.id || !s.cagedByKillerId)
  );

  const downedSurv = availableDowned.sort((a, b) => {
    return Math.hypot(a.x - k.x, a.z - k.z) - Math.hypot(b.x - k.x, b.z - k.z);
  })[0];

  const distToDowned = downedSurv ? Math.hypot(downedSurv.x - k.x, downedSurv.z - k.z) : Infinity;

  // Only prioritize downed survivor if no immediate nearby active survivor threatens, or downed is close (<18m)
  const shouldHandleDowned = downedSurv && (distToDowned <= 18.0 || activeSurvivorsNearby.length === 0);

  if (shouldHandleDowned && downedSurv) {
    if (distToDowned > 3.2) {
      // Move to downed survivor
      const angle = Math.atan2(downedSurv.x - k.x, downedSurv.z - k.z);
      k.rotationY = angle;
      const targetX = k.x + Math.sin(angle) * k.speed * ctx.delta;
      const targetZ = k.z + Math.cos(angle) * k.speed * ctx.delta;
      const moved = aiMoveWithCollision(k.x, k.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
      k.x = moved.x;
      k.z = moved.z;

      if (pMesh?.userData?.updateMovementPose) {
        const dx = moved.x - killer.x;
        pMesh.userData.updateMovementPose(ctx.delta, true, dx >= 0 ? 1 : -1, k.health);
      }

      return {
        updatedKiller: k,
        decision: {
          moveType: 'HANDLE_DOWNED_SURVIVOR',
          targetPos: { x: downedSurv.x, z: downedSurv.z },
          targetId: downedSurv.id,
          detail: `Moving to downed survivor ${downedSurv.name} (${distToDowned.toFixed(1)}m)`,
        },
      };
    } else {
      // Within range: channel 5-second caging
      downedSurv.isBeingCaged = true;
      downedSurv.cagedByKillerId = k.id;
      const nextProg = Math.min(100, (downedSurv.cagingProgress || 0) + (ctx.delta / 5.0) * 100);
      downedSurv.cagingProgress = nextProg;

      if (pMesh?.userData?.updateMovementPose) {
        pMesh.userData.updateMovementPose(ctx.delta, false, 'idle', k.health);
      }

      if (nextProg >= 100) {
        // Complete imprisonment
        const bestCage = findBestCage({ x: k.x, z: k.z }, ctx.allPlayers, ctx.cages);
        downedSurv.health = 'caged';
        downedSurv.cageTimer = downedSurv.cageTimer !== undefined ? downedSurv.cageTimer : 90;
        downedSurv.cageCount = (downedSurv.cageCount || 0) + 1;
        downedSurv.assignedCageId = bestCage.id;
        downedSurv.x = bestCage.x;
        downedSurv.z = bestCage.z;
        downedSurv.healProgress = 0;
        downedSurv.cagingProgress = 0;
        downedSurv.isBeingCaged = false;
        downedSurv.cagedByKillerId = null;

        const targetCageObj = ctx.cages.find(c => c.id === bestCage.id);
        if (targetCageObj) {
          targetCageObj.occupiedPlayerId = downedSurv.id;
        }

        const targetMesh = ctx.playerMeshes[downedSurv.id];
        if (targetMesh) {
          targetMesh.position.set(bestCage.x, 0, bestCage.z);
          if (targetMesh.userData?.setPose) targetMesh.userData.setPose('ko');
        }

        ctx.onSetKillerBreakCharges(c => c + 1);
        sound.playScreamSound();
        k.attackCooldown = 2.0;

        console.log(`[KILLER AI] ${k.name} (${k.id}) -> Imprisoned ${downedSurv.name} in cage #${bestCage.id + 1} (AttackCD: 2.0s)`);

        return {
          updatedKiller: k,
          decision: {
            moveType: 'HANDLE_DOWNED_SURVIVOR',
            targetPos: { x: bestCage.x, z: bestCage.z },
            targetId: downedSurv.id,
            detail: `Imprisoned ${downedSurv.name} in cage #${bestCage.id + 1}`,
          },
          cagedSurvivorId: downedSurv.id,
        };
      }

      return {
        updatedKiller: k,
        decision: {
          moveType: 'HANDLE_DOWNED_SURVIVOR',
          targetPos: { x: downedSurv.x, z: downedSurv.z },
          targetId: downedSurv.id,
          detail: `Caging ${downedSurv.name} [ ${Math.floor(nextProg)}% ]`,
        },
      };
    }
  }

  // ==========================================================================
  // PRIORITY 2: MOVE 5 — FINAL-PHASE ESCAPE PREVENTION
  // Condition: All required target generators completed
  // ==========================================================================
  if (gatesArePowered && activeGate) {
    // 1. Check if any survivor is actively opening the gate or near the gate
    const gateSurv = survivors.find(s => {
      if (s.health !== 'healthy' && s.health !== 'injured') return false;
      return Math.hypot(s.x - activeGate.x, s.z - activeGate.z) <= 8.5;
    });

    if (gateSurv) {
      const dToSurv = Math.hypot(gateSurv.x - k.x, gateSurv.z - k.z);
      const angle = Math.atan2(gateSurv.x - k.x, gateSurv.z - k.z);
      k.rotationY = angle;

      // Elena Ice Projectile on gate defense (range: 2.5m - 28.0m)
      if (k.characterId === 'elena' && k.skillCooldown <= 0 && dToSurv >= 2.5 && dToSurv <= 28.0 && ctx.scene) {
        const proj = spawnIceAttackProjectile(
          ctx.scene,
          k.id,
          k.x,
          k.y || 0,
          k.z,
          angle,
          26,
          35
        );
        ctx.iceProjectiles.push(proj);
        k.skillCooldown = 12;
        sound.playSkillSound();
        console.log(`[KILLER AI] ${k.name} (${k.id}) -> Fired Ice Attack Projectile at ${gateSurv.name} (Gate Defense, SkillCD: 12s)`);
      }

      if (dToSurv > 2.0) {
        // Charge at gate opener
        const targetX = k.x + Math.sin(angle) * k.speed * ctx.delta;
        const targetZ = k.z + Math.cos(angle) * k.speed * ctx.delta;
        const moved = aiMoveWithCollision(k.x, k.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
        k.x = moved.x;
        k.z = moved.z;

        if (pMesh?.userData?.updateMovementPose) {
          pMesh.userData.updateMovementPose(ctx.delta, true, 1, k.health);
        }
      } else if ((k.attackCooldown || 0) <= 0) {
        // Strike gate opener
        k.attackCooldown = 2.0;
        sound.playHitSound();
        sound.playScreamSound();

        let hitNewHealth: HealthState;
        let deepInjury = false;
        let msg = '';

        if (k.characterId === 'gourmet') {
          const gHit = processGourmetHitOnSurvivor(k, gateSurv);
          hitNewHealth = gHit.nextHealth;
          deepInjury = gHit.deepInjury;
          msg = gHit.message;
        } else {
          hitNewHealth = gateSurv.health === 'healthy' ? 'injured' : 'downed';
          msg = hitNewHealth === 'downed' 
            ? `⚔️ 殺手重擊阻止大門開啟！${gateSurv.name} 瀕死倒地！`
            : `⚔️ 殺手突襲！${gateSurv.name} 受到傷害！`;
        }

        console.log(`[KILLER AI] ${k.name} (${k.id}) -> Gate Intercept Strike on ${gateSurv.name} -> ${hitNewHealth} (AttackCD: 2.0s)`);

        gateSurv.health = hitNewHealth;
        gateSurv.deepInjury = deepInjury;
        gateSurv.hitBoostTime = hitNewHealth === 'injured' ? 2.0 : 0;

        return {
          updatedKiller: k,
          decision: {
            moveType: 'FINAL_PHASE_DEFENSE',
            targetPos: { x: gateSurv.x, z: gateSurv.z },
            targetId: gateSurv.id,
            detail: `Attacked gate opener ${gateSurv.name} -> ${hitNewHealth}`,
          },
          hitResult: {
            survivorId: gateSurv.id,
            newHealth: hitNewHealth,
            deepInjury,
            message: msg,
          },
          hitSurvivorId: gateSurv.id,
        };
      } else {
        // In close range during attack cooldown, keep pressing towards gate opener
        const targetX = k.x + Math.sin(angle) * (k.speed * 0.9) * ctx.delta;
        const targetZ = k.z + Math.cos(angle) * (k.speed * 0.9) * ctx.delta;
        const moved = aiMoveWithCollision(k.x, k.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
        k.x = moved.x;
        k.z = moved.z;

        if (pMesh?.userData?.updateMovementPose) {
          pMesh.userData.updateMovementPose(ctx.delta, true, 1, k.health);
        }

        return {
          updatedKiller: k,
          decision: {
            moveType: 'FINAL_PHASE_DEFENSE',
            targetPos: { x: gateSurv.x, z: gateSurv.z },
            targetId: gateSurv.id,
            detail: `Preventing gate opening by ${gateSurv.name} (Dist: ${dToSurv.toFixed(1)}m, Cooldown: ${(k.attackCooldown || 0).toFixed(1)}s)`,
          },
        };
      }
    }

    // 2. If no survivor at gate, patrol towards exit gate to intercept
    const dToGate = Math.hypot(activeGate.x - k.x, activeGate.z - k.z);
    if (dToGate > 5.0) {
      const angle = Math.atan2(activeGate.x - k.x, activeGate.z - k.z);
      k.rotationY = angle;
      const targetX = k.x + Math.sin(angle) * k.speed * ctx.delta;
      const targetZ = k.z + Math.cos(angle) * k.speed * ctx.delta;
      const moved = aiMoveWithCollision(k.x, k.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
      k.x = moved.x;
      k.z = moved.z;

      if (pMesh?.userData?.updateMovementPose) {
        pMesh.userData.updateMovementPose(ctx.delta, true, 1, k.health);
      }

      return {
        updatedKiller: k,
        decision: {
          moveType: 'FINAL_PHASE_DEFENSE',
          targetPos: { x: activeGate.x, z: activeGate.z },
          detail: `Patrolling exit gate (Dist: ${dToGate.toFixed(1)}m)`,
        },
      };
    }
  }

  // ==========================================================================
  // PRIORITY 3: MOVE 2 — CHASE SURVIVOR
  // Condition: Valid survivor detected within detection range or alerted
  // ==========================================================================
  let closestSurv: PlayerState | null = null;
  let minEffectiveDist = 999;

  for (const s of survivors) {
    if (s.health !== 'healthy' && s.health !== 'injured') continue;

    let dist = Math.hypot(s.x - k.x, s.z - k.z);

    // Tariq Betrayal Effect: amplified aura / tracks (strongly attracts killer)
    if (s.betrayedTeammateTime && s.betrayedTeammateTime > 0) {
      dist *= 0.35;
    }
    // Tariq Stealth Effect: invisible aura (killer ignores)
    if (s.tariqStealthTime && s.tariqStealthTime > 0) {
      dist *= 3.0;
    }
    // Scream reveal bonus
    if (s.fearScreamRevealedToKiller) {
      dist *= 0.7;
    }

    if (dist < minEffectiveDist && dist < 32.0) {
      minEffectiveDist = dist;
      closestSurv = s;
    }
  }

  if (closestSurv) {
    const rawDist = Math.hypot(closestSurv.x - k.x, closestSurv.z - k.z);
    const angle = Math.atan2(closestSurv.x - k.x, closestSurv.z - k.z);
    k.rotationY = angle;

    // Killer Skill Usage in Chase:
    // 1. Elena Ice Projectile (smooth ranged attack: 2.5m - 28.0m)
    if (k.characterId === 'elena' && k.skillCooldown <= 0 && rawDist >= 2.5 && rawDist <= 28.0 && ctx.scene) {
      const proj = spawnIceAttackProjectile(
        ctx.scene,
        k.id,
        k.x,
        k.y || 0,
        k.z,
        angle,
        26,
        35
      );
      ctx.iceProjectiles.push(proj);
      k.skillCooldown = 12;
      sound.playSkillSound();
      console.log(`[KILLER AI] ${k.name} (${k.id}) -> Fired Ice Attack Projectile during chase at ${closestSurv.name} (Dist: ${rawDist.toFixed(1)}m, SkillCD: 12s)`);
    }
    // 2. Gourmet Berserk Rage (range: < 15m)
    else if (k.characterId === 'gourmet' && k.skillCooldown <= 0 && rawDist <= 15.0) {
      k.berserkTime = 30;
      k.skillCooldown = 15;
      sound.playSkillSound();
      console.log(`[KILLER AI] ${k.name} (${k.id}) -> Activated Gourmet Berserk Rage in chase (Target: ${closestSurv.name}, Duration: 30s, SkillCD: 15s)`);
    }

    if (rawDist > 2.0) {
      // Pursue survivor
      const targetX = k.x + Math.sin(angle) * k.speed * ctx.delta;
      const targetZ = k.z + Math.cos(angle) * k.speed * ctx.delta;
      const moved = aiMoveWithCollision(k.x, k.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
      k.x = moved.x;
      k.z = moved.z;

      if (pMesh?.userData?.updateMovementPose) {
        const dx = moved.x - killer.x;
        pMesh.userData.updateMovementPose(ctx.delta, true, dx >= 0 ? 1 : -1, k.health);
      }

      return {
        updatedKiller: k,
        decision: {
          moveType: 'CHASE_SURVIVOR',
          targetPos: { x: closestSurv.x, z: closestSurv.z },
          targetId: closestSurv.id,
          detail: `Chasing ${closestSurv.name} (Dist: ${rawDist.toFixed(1)}m)`,
        },
      };
    } else if ((k.attackCooldown || 0) <= 0 && (!closestSurv.hitBoostTime || closestSurv.hitBoostTime <= 0)) {
      // Close range melee attack
      k.attackCooldown = 2.0;
      sound.playHitSound();
      sound.playScreamSound();

      let hitNewHealth: HealthState;
      let deepInjury = false;
      let msg = '';

      if (k.characterId === 'gourmet') {
        const gHit = processGourmetHitOnSurvivor(k, closestSurv);
        hitNewHealth = gHit.nextHealth;
        deepInjury = gHit.deepInjury;
        msg = gHit.message;
      } else {
        hitNewHealth = closestSurv.health === 'healthy' ? 'injured' : 'downed';
        msg = hitNewHealth === 'downed' 
          ? `⚔️ 殺手重擊！${closestSurv.name} 瀕死倒地 (Downed)！`
          : `⚔️ 殺手揮刀命中！${closestSurv.name} 受到傷害！`;
      }

      console.log(`[KILLER AI] ${k.name} (${k.id}) -> Melee attack hit on ${closestSurv.name} -> ${hitNewHealth} (AttackCD: 2.0s)`);

      closestSurv.health = hitNewHealth;
      closestSurv.deepInjury = deepInjury;
      closestSurv.hitBoostTime = hitNewHealth === 'injured' ? 2.0 : 0;

      return {
        updatedKiller: k,
        decision: {
          moveType: 'CHASE_SURVIVOR',
          targetPos: { x: closestSurv.x, z: closestSurv.z },
          targetId: closestSurv.id,
          detail: `Hit ${closestSurv.name} -> ${hitNewHealth}`,
        },
        hitResult: {
          survivorId: closestSurv.id,
          newHealth: hitNewHealth,
          deepInjury,
          message: msg,
        },
        hitSurvivorId: closestSurv.id,
      };
    } else {
      // Close-range tracking / pressure while on attack cooldown or during hit boost
      const targetX = k.x + Math.sin(angle) * (k.speed * 0.9) * ctx.delta;
      const targetZ = k.z + Math.cos(angle) * (k.speed * 0.9) * ctx.delta;
      const moved = aiMoveWithCollision(k.x, k.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
      k.x = moved.x;
      k.z = moved.z;

      if (pMesh?.userData?.updateMovementPose) {
        const dx = moved.x - killer.x;
        pMesh.userData.updateMovementPose(ctx.delta, true, dx >= 0 ? 1 : -1, k.health);
      }

      return {
        updatedKiller: k,
        decision: {
          moveType: 'CHASE_SURVIVOR',
          targetPos: { x: closestSurv.x, z: closestSurv.z },
          targetId: closestSurv.id,
          detail: `Pressuring ${closestSurv.name} (Cooldown: ${(k.attackCooldown || 0).toFixed(1)}s, Dist: ${rawDist.toFixed(1)}m)`,
        },
      };
    }
  }

  // ==========================================================================
  // PRIORITY 4: MOVE 4 — DAMAGE GENERATOR
  // Condition: Has break charges, generator has progress, no immediate chase target < 8m
  // ==========================================================================
  if (ctx.killerBreakCharges > 0) {
    const damageableGen = ctx.generators.find(
      g => !g.isCompleted && g.progress > 5 && Math.hypot(g.x - k.x, g.z - k.z) < 16.0
    );

    if (damageableGen) {
      const dGen = Math.hypot(damageableGen.x - k.x, damageableGen.z - k.z);

      if (dGen > 2.8) {
        const angle = Math.atan2(damageableGen.x - k.x, damageableGen.z - k.z);
        k.rotationY = angle;
        const targetX = k.x + Math.sin(angle) * k.speed * ctx.delta;
        const targetZ = k.z + Math.cos(angle) * k.speed * ctx.delta;
        const moved = aiMoveWithCollision(k.x, k.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
        k.x = moved.x;
        k.z = moved.z;

        if (pMesh?.userData?.updateMovementPose) {
          pMesh.userData.updateMovementPose(ctx.delta, true, 1, k.health);
        }

        return {
          updatedKiller: k,
          decision: {
            moveType: 'DAMAGE_GENERATOR',
            targetPos: { x: damageableGen.x, z: damageableGen.z },
            targetId: damageableGen.id,
            detail: `Moving to damage generator #${damageableGen.id + 1} (${dGen.toFixed(1)}m)`,
          },
        };
      } else {
        // Kick generator (deduct 10% progress, consume 1 charge)
        sound.playSkillSound();
        const deduction = damageableGen.progress * 0.10;
        damageableGen.progress = Math.max(0, damageableGen.progress - deduction);
        ctx.onSetKillerBreakCharges(c => Math.max(0, c - 1));
        k.attackCooldown = 1.8;

        console.log(`[KILLER AI] ${k.name} (${k.id}) -> Kicked generator #${damageableGen.id + 1}, reduced 10% progress (Charges remaining: ${ctx.killerBreakCharges - 1})`);

        if (pMesh?.userData?.updateMovementPose) {
          pMesh.userData.updateMovementPose(ctx.delta, false, 'idle', k.health);
        }

        return {
          updatedKiller: k,
          decision: {
            moveType: 'DAMAGE_GENERATOR',
            targetPos: { x: damageableGen.x, z: damageableGen.z },
            targetId: damageableGen.id,
            detail: `Damaged generator #${damageableGen.id + 1} (Reduced by 10%)`,
          },
        };
      }
    }
  }

  // ==========================================================================
  // PRIORITY 5: MOVE 1 — PATROL / SEARCH
  // Condition: No higher priority actions
  // ==========================================================================
  // Check noise pings first (e.g. scream or failed skill)
  const recentPing = ctx.noisePings.length > 0 ? ctx.noisePings[ctx.noisePings.length - 1] : null;
  let patrolTarget: { x: number; z: number } | null = null;
  let patrolDetail = 'Patrolling generators';

  if (recentPing && Date.now() - recentPing.createdAt < 7000) {
    patrolTarget = { x: recentPing.x, z: recentPing.z };
    patrolDetail = `Investigating noise ping: ${recentPing.label}`;
  } else {
    // Patrol incomplete target generators
    const incompleteGens = ctx.generators.filter(g => !g.isCompleted && g.isTargetGen);
    if (incompleteGens.length > 0) {
      // Pick generator with highest progress or farthest from current patrol
      incompleteGens.sort((a, b) => b.progress - a.progress);
      patrolTarget = { x: incompleteGens[0].x, z: incompleteGens[0].z };
      patrolDetail = `Patrolling target gen #${incompleteGens[0].id + 1} [ ${Math.floor(incompleteGens[0].progress)}% ]`;
    }
  }

  if (patrolTarget) {
    const dTarget = Math.hypot(patrolTarget.x - k.x, patrolTarget.z - k.z);

    if (dTarget > 3.0) {
      const angle = Math.atan2(patrolTarget.x - k.x, patrolTarget.z - k.z);
      k.rotationY = angle;
      const targetX = k.x + Math.sin(angle) * (k.speed * 0.85) * ctx.delta;
      const targetZ = k.z + Math.cos(angle) * (k.speed * 0.85) * ctx.delta;
      const moved = aiMoveWithCollision(k.x, k.z, targetX, targetZ, ctx.mapColliders, ctx.genPositions, 0.75);
      k.x = moved.x;
      k.z = moved.z;

      if (pMesh?.userData?.updateMovementPose) {
        const dx = moved.x - killer.x;
        pMesh.userData.updateMovementPose(ctx.delta, true, dx >= 0 ? 1 : -1, k.health);
      }
    } else {
      if (pMesh?.userData?.updateMovementPose) {
        pMesh.userData.updateMovementPose(ctx.delta, false, 'idle', k.health);
      }
    }

    return {
      updatedKiller: k,
      decision: {
        moveType: 'PATROL_SEARCH',
        targetPos: patrolTarget,
        detail: patrolDetail,
      },
    };
  }

  // Fallback idle
  if (pMesh?.userData?.updateMovementPose) {
    pMesh.userData.updateMovementPose(ctx.delta, false, 'idle', k.health);
  }
  return {
    updatedKiller: k,
    decision: {
      moveType: 'PATROL_SEARCH',
      targetPos: null,
      detail: 'Scanning map',
    },
  };
}
