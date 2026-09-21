// node --experimental-vm-modules tests/etapa6-static.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const importMap = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
const files = fs.readdirSync(root).filter(f => f.endsWith('.js')).concat(fs.readdirSync(path.join(root, 'models')).filter(f => f.endsWith('.js')).map(f => 'models/' + f));
const modules = new Map();
const remoteNames = new Map();
for (const file of files) {
    execFileSync(process.execPath, ['--check', path.join(root, file)]);
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    modules.set(path.join(root, file), new vm.SourceTextModule(source, { identifier: path.join(root, file) }));
    for (const match of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)) {
        const url = importMap[match[2]] || match[2];
        if (!url.startsWith('https:')) continue;
        const names = remoteNames.get(url) || new Set();
        match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean).forEach(n => names.add(n));
        remoteNames.set(url, names);
        assert.ok(url.includes('/12.18.0/'), url);
    }
}
const remotes = new Map([...remoteNames].map(([url, names]) => [url, new vm.SyntheticModule([...names], function() {}, { identifier: url })]));
(async () => {
    const { HtmlValidate } = require('html-validate');
    const validator = new HtmlValidate({ rules: { 'close-order': 'error', 'no-dup-id': 'error', 'attr-quotes': 'error', 'no-dup-attr': 'error', 'element-permitted-content': 'error' } });
    const validation = await validator.validateFile(path.join(root, 'index.html'));
    assert.equal(validation.valid, true, JSON.stringify(validation.results));
    for (const module of modules.values()) {
        if (module.status === 'unlinked') await module.link((specifier, importer) => {
            specifier = importMap[specifier] || specifier;
            const result = specifier.startsWith('https:') ? remotes.get(specifier) : modules.get(path.resolve(path.dirname(importer.identifier), specifier));
            assert.ok(result, specifier);
            return result;
        });
    }
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const scopes = [html.replace(/<template\b[^>]*>[\s\S]*?<\/template>/g, ''), ...[...html.matchAll(/<template\b[^>]*>([\s\S]*?)<\/template>/g)].map(m => m[1])];
    let count = 0;
    for (const scope of scopes) {
        const ids = [...scope.matchAll(/\bid\s*=\s*"([^"]+)"/g)].map(m => m[1]);
        assert.equal(new Set(ids).size, ids.length, 'duplicate IDs within one document/template scope');
        count += ids.length;
    }
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
        if (/\bsrc=|type="importmap"/.test(m[1])) continue;
        if (/type="module"/.test(m[1])) new vm.SourceTextModule(m[2]);
        else new vm.Script(m[2]);
    }
    for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
        if (/^(?:https?:|data:|mailto:)/.test(m[1])) continue;
        assert.ok(fs.existsSync(path.resolve(root, m[1].split('?')[0])), m[1]);
    }
    console.log(`PASS: syntax of ${files.length} JS modules, inline scripts, local imports/exports linked, local HTML assets, ${count} IDs unique within document/template scopes, Firebase 12.18.0 imports.`);
    console.log('Remote SDK exports synthesized from imports; no network/SDK execution.');
    console.log('HTML validation passed: nesting/content, attribute quotes, duplicate attributes and scoped IDs.');
})().catch(e => { console.error(e); process.exitCode = 1; });
