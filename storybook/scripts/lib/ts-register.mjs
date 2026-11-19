// node --import ./scripts/lib/ts-register.mjs <script>
import { register } from 'node:module';
register('./ts-hooks.mjs', import.meta.url);
