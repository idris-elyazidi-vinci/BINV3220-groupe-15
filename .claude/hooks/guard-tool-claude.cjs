// Adaptateur Claude Code pour le hook pédagogique Tool Guardian (.github/hooks/guard-tool.cjs).
//
// Le script d'origine est écrit pour Copilot : il répond `{"permissionDecision":"deny", ...}`
// au premier niveau. Claude Code attend la décision d'un hook PreToolUse dans
// `hookSpecificOutput`. On relaie donc l'événement tel quel au script d'origine (qui lit déjà
// `tool_name` / `tool_input`, les noms de champs de Claude Code) et on traduit sa réponse.
// Le script d'origine n'est pas modifié : il reste utilisable par Copilot.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? path.resolve(__dirname, '..', '..');
const original = path.join(projectDir, '.github', 'hooks', 'guard-tool.cjs');

const result = spawnSync(process.execPath, [original], {
  input: fs.readFileSync(0),
  encoding: 'utf8',
  timeout: 8000,
});

let decision = {};
try {
  decision = JSON.parse(result.stdout || '{}');
} catch {
  decision = {
    permissionDecision: 'deny',
    permissionDecisionReason: 'Tool Guardian : réponse illisible du script d’origine.',
  };
}

if (decision.permissionDecision === 'deny') {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: decision.permissionDecisionReason,
    },
  }));
} else {
  // Aucune décision : les permissions habituelles de Claude Code s'appliquent.
  process.stdout.write('{}');
}
