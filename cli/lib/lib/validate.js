import { StateSchema } from './schema.js';
export function validateState(obj) {
    const r = StateSchema.safeParse(obj);
    if (r.success)
        return { ok: true, errors: [] };
    return { ok: false, errors: r.error.issues };
}
export function lintNextAction(s) {
    const t = s.trim();
    if (t.length < 12)
        return 'next_action too short';
    if (/^(continue work|do next step|fix remaining)$/i.test(t))
        return 'next_action too vague';
    if (/^(continue|do|fix).+$/i.test(t) && t.split(/\s+/).length < 4)
        return 'next_action too vague';
    return null;
}
export function checkSecrets(diff, globs) {
    if (!diff)
        return null;
    for (const g of globs) {
        if (g === '.env' && diff.includes('.env'))
            return '.env leaked';
        if (g === '*.pem' && (diff.includes('.pem') || diff.includes('-----BEGIN')))
            return 'pem leaked';
        if (g.includes('kubeconfig') && diff.includes('kubeconfig'))
            return 'kubeconfig leaked';
        if (g === 'secrets/**' && diff.includes('secrets/'))
            return 'secrets/** leaked';
        // generic glob simple check
        if (diff.includes(g.replace('*', '')) && g.includes('*')) {
            // already handled specific cases; fall through
        }
    }
    if (diff.includes('agos-dev-readonly-kubeconfig'))
        return 'kubeconfig leaked';
    return null;
}
export function isVagueNextAction(s) {
    return lintNextAction(s) !== null;
}
