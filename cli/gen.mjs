
import { stateJsonSchema } from './lib/lib/schema.js';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const p = resolve('skills/continuity/templates/state.schema.json');
writeFileSync(p, JSON.stringify(stateJsonSchema, null, 2));
console.log('wrote', p);
