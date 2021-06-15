'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const fs = require("fs");
const vscode = require("vscode");
const path = require("path");
var SourceType;
(function (SourceType) {
    SourceType[SourceType["SCRIPT"] = 0] = "SCRIPT";
    SourceType[SourceType["STYLE"] = 1] = "STYLE";
})(SourceType || (SourceType = {}));
const EPSG_REGEX = /^EPSG:\d+$/g;
const SCHEME = "map-preview";
const WEBVIEW_TYPE = "mapPreview";
const PREVIEW_COMMAND_ID = "map.preview";
const PREVIEW_PROJ_COMMAND_ID = "map.preview-with-proj";
function makePreviewUri(doc) {
    return vscode.Uri.parse(`${SCHEME}://map-preview/map-preview: ${doc.fileName}`);
}
class PreviewDocumentContentProvider {
    constructor(extensionPath) {
        this.extensionPath = extensionPath;
        this._onDidChange = new vscode.EventEmitter();
        this._projections = new Map();
        this._subscriptions = vscode.Disposable.from(vscode.workspace.onDidOpenTextDocument(this.onDocumentOpened.bind(this)));
    }
    dispose() {
        this._projections.clear();
        this._subscriptions.dispose();
        this._onDidChange.dispose();
    }
    onDocumentOpened(e) {
        //console.log(`Document opened ${e.uri}`);
        const uri = makePreviewUri(e);
        this._onDidChange.fire(uri);
    }
    triggerVirtualDocumentChange(uri) {
        this._onDidChange.fire(uri);
    }
    clearPreviewProjection(uri) {
        this._projections.delete(uri.toString());
    }
    setPreviewProjection(uri, projection) {
        this._projections.set(uri.toString(), projection);
    }
    resolveDocument(uri) {
        const matches = vscode.window.visibleTextEditors.filter(ed => {
            return makePreviewUri(ed.document).toString() == uri.toString();
        });
        if (matches.length >= 1) { //If we get more than one match, it's probably because the same document has been opened more than once (eg. split view)
            return matches[0].document;
        }
        else {
            return null;
        }
    }
    generateDocumentContent(uri) {
        const doc = this.resolveDocument(uri);
        if (doc) {
            let proj = null;
            const sUri = uri.toString();
            if (this._projections.has(sUri)) {
                proj = this._projections.get(sUri);
            }
            const content = this.createMapPreview(doc, proj);
            const debugSettings = vscode.workspace.getConfiguration("map.preview.debug");
            if (debugSettings.has("dumpContentPath")) {
                const dumpPath = debugSettings.get("dumpContentPath");
                if (dumpPath) {
                    try {
                        fs.writeFileSync(dumpPath, content);
                    }
                    catch (e) {
                        vscode.window.showErrorMessage(`Error dumping preview content: ${e.message}`);
                    }
                }
            }
            return content;
        }
        else {
            return this.errorSnippet(`<h1>Error preparing preview</h1><p>Cannot resolve document for virtual document URI: ${uri.toString()}</p>`);
        }
    }
    provideTextDocumentContent(uri) {
        const content = this.generateDocumentContent(uri);
        return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <!--
        Use a content security policy to only allow loading images from https or from our extension directory,
        and only allow scripts that have a specific nonce.
        -->
        <meta 
            http-equiv="Content-Security-Policy"
            content="default-src 'none';
                img-src ${this._wctx.getCspSource()} data: https:;
                style-src 'unsafe-inline' ${this._wctx.getCspSource()};
                style-src-elem 'unsafe-inline' ${this._wctx.getCspSource()};
                script-src 'nonce-${this._wctx.getScriptNonce()}' ${this._wctx.getCspSource()};" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Map Preview</title>
    </head>
    ${content}
</html>`;
    }
    errorSnippet(error) {
        return `
            <body>
                ${error}
            </body>`;
    }
    /**
     * Expose an event to signal changes of _virtual_ documents
     * to the editor
     */
    get onDidChange() {
        return this._onDidChange.event;
    }
    attachWebViewContext(xformer) {
        this._wctx = xformer;
    }
    detachWebViewContext() {
        this._wctx = undefined;
    }
    createLocalSource(file, type) {
        const onDiskPath = vscode.Uri.file(path.join(this.extensionPath, 'static', file));
        const source_path = this._wctx.asWebviewUri(onDiskPath);
        switch (type) {
            case SourceType.SCRIPT:
                return `<script nonce="${this._wctx.getScriptNonce()}" src="${source_path}" type="text/javascript"></script>`;
            case SourceType.STYLE:
                return `<link nonce="${this._wctx.getStylesheetNonce()}" href="${source_path}" rel="stylesheet" />`;
        }
    }
    cleanText(text) {
        const scrubRegexes = [
            { regex: /\\/g, replace: "\\\\" },
            { regex: /(<\!\[CDATA\[[\s\S]*?]]>)/g, replace: "" },
            { regex: /`/g, replace: "\\`" },
            { regex: /\${/g, replace: "\\${" } //Start of ES6 template string placeholder
        ];
        for (const r of scrubRegexes) {
            text = text.replace(r.regex, r.replace);
        }
        return text;
    }
    createMapPreview(doc, projection = null) {
        //Should we languageId check here?
        const text = this.cleanText(doc.getText());
        const config = vscode.workspace.getConfiguration("map.preview");
        return `<body>
            <div id="map" style="width: 100%; height: 100%">
                <div id="format" style="position: absolute; left: 40; top: 5; z-index: 100; padding: 5px; background: yellow; color: black"></div>
            </div>` +
            this.createLocalSource("ol.css", SourceType.STYLE) +
            this.createLocalSource("ol-layerswitcher.css", SourceType.STYLE) +
            this.createLocalSource("ol-popup.css", SourceType.STYLE) +
            this.createLocalSource("proj4.js", SourceType.SCRIPT) +
            this.createLocalSource("papaparse.min.js", SourceType.SCRIPT) +
            this.createLocalSource("ol.js", SourceType.SCRIPT) +
            this.createLocalSource("ol-layerswitcher.js", SourceType.SCRIPT) +
            this.createLocalSource("ol-popup.js", SourceType.SCRIPT) +
            this.createLocalSource("preview.js", SourceType.SCRIPT) +
            this.createLocalSource("preview.css", SourceType.STYLE) +
            `<script nonce="${this._wctx.getScriptNonce()}" type="text/javascript">

                function setError(e) {
                    var mapEl = document.getElementById("map");
                    var errHtml = "<h1>An error occurred rendering preview</h1>";
                    //errHtml += "<p>" + e.name + ": " + e.message + "</p>";
                    errHtml += "<pre>" + e.stack + "</pre>";
                    mapEl.innerHTML = errHtml;
                }

                try {
                    var previewProj = ${projection ? ('"' + projection + '"') : "null"};
                    var previewConfig = ${JSON.stringify(config)};
                    previewConfig.sourceProjection = previewProj;
                    var content = \`${text}\`;
                    var formatOptions = { featureProjection: 'EPSG:3857' };
                    if (previewProj != null) {
                        formatOptions.dataProjection = previewProj; 
                    }
                    createPreviewSource(content, formatOptions, previewConfig, function (preview) {
                        document.getElementById("format").innerHTML = "Format: " + preview.driver;
                        initPreviewMap('map', preview, previewConfig);
                    });
                } catch (e) {
                    setError(e);
                }
            </script>
        </body>`;
    }
}
function loadWebView(content, previewUri, fileName, extensionPath) {
    //const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    const panel = vscode.window.createWebviewPanel(WEBVIEW_TYPE, `Map Preview: ${fileName}`, vscode.ViewColumn.Two, {
        // Enable scripts in the webview
        enableScripts: true,
        // Restrict the webview to only loading content from our extension's `static` directory.
        localResourceRoots: [
            vscode.Uri.file(path.join(extensionPath, 'static'))
        ]
    });
    const scriptNonce = getNonce();
    const cssNonce = getNonce();
    const wctx = {
        asWebviewUri: uri => panel.webview.asWebviewUri(uri),
        getCspSource: () => panel.webview.cspSource,
        getScriptNonce: () => scriptNonce,
        getStylesheetNonce: () => cssNonce
    };
    content.attachWebViewContext(wctx);
    const html = content.provideTextDocumentContent(previewUri);
    content.detachWebViewContext();
    panel.webview.html = html;
}
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const extensionPath = context.extensionPath;
    const provider = new PreviewDocumentContentProvider(extensionPath);
    const registration = vscode.workspace.registerTextDocumentContentProvider(SCHEME, provider);
    const previewCommand = vscode.commands.registerCommand(PREVIEW_COMMAND_ID, () => {
        const doc = vscode.window.activeTextEditor.document;
        const docName = path.basename(doc.fileName);
        const previewUri = makePreviewUri(doc);
        provider.clearPreviewProjection(previewUri);
        provider.triggerVirtualDocumentChange(previewUri);
        loadWebView(provider, previewUri, docName, extensionPath);
    });
    const previewWithProjCommand = vscode.commands.registerCommand(PREVIEW_PROJ_COMMAND_ID, () => {
        const opts = {
            canPickMany: false,
            //prompt: "Enter the EPSG code for your projection",
            placeHolder: "EPSG:XXXX"
        };
        const config = vscode.workspace.getConfiguration("map.preview");
        const codes = [
            "EPSG:4326",
            "EPSG:3857",
            ...config.projections
                .filter(prj => prj.epsgCode != 4326 && prj.epsgCode != 3857)
                .map(prj => `EPSG:${prj.epsgCode}`)
        ].map((epsg) => ({
            label: `Preview in projection (${epsg})`,
            projection: epsg
        }));
        vscode.window.showQuickPick(codes, opts).then(val => {
            if (val) {
                const doc = vscode.window.activeTextEditor.document;
                const docName = path.basename(doc.fileName);
                const previewUri = makePreviewUri(doc);
                provider.setPreviewProjection(previewUri, val.projection);
                provider.triggerVirtualDocumentChange(previewUri);
                loadWebView(provider, previewUri, docName, extensionPath);
            }
        });
    });
    context.subscriptions.push(previewCommand, registration);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map