// WiFi Billionaire — native macOS wrapper (AppKit + WKWebView).
// Serves the bundled web game over a custom URL scheme and mirrors the
// save to Application Support so progress survives independently of WebKit storage.
import Cocoa
import WebKit

let saveKey = "wifi_billionaire_save_v1"

func saveFileURL() -> URL {
    let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("WiFiBillionaire", isDirectory: true)
    try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    return dir.appendingPathComponent("save.json")
}

final class SchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else { return }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let base = Bundle.main.resourceURL!.appendingPathComponent("web")
        let fileURL = base.appendingPathComponent(String(path.dropFirst())).standardizedFileURL
        guard fileURL.path.hasPrefix(base.path),
              let data = FileManager.default.contents(atPath: fileURL.path) else {
            urlSchemeTask.didFailWithError(NSError(domain: "WiFiBillionaire", code: 404))
            return
        }
        let mime: String
        switch fileURL.pathExtension.lowercased() {
        case "html": mime = "text/html"
        case "js":   mime = "text/javascript"
        case "css":  mime = "text/css"
        case "svg":  mime = "image/svg+xml"
        case "png":  mime = "image/png"
        case "json": mime = "application/json"
        default:     mime = "application/octet-stream"
        }
        urlSchemeTask.didReceive(URLResponse(url: url, mimeType: mime,
                                             expectedContentLength: data.count, textEncodingName: "utf-8"))
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }
    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKUIDelegate {
    var window: NSWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ notification: Notification) {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(SchemeHandler(), forURLScheme: "wifib")
        let ucc = config.userContentController
        ucc.add(self, name: "saveBridge")

        // Restore the on-disk save into localStorage before the game boots.
        if let data = try? Data(contentsOf: saveFileURL()),
           let json = String(data: data, encoding: .utf8), !json.isEmpty,
           let literalData = try? JSONEncoder().encode(json),
           let literal = String(data: literalData, encoding: .utf8) {
            let restore = "try { localStorage.setItem('\(saveKey)', \(literal)); } catch (e) {}"
            ucc.addUserScript(WKUserScript(source: restore, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        }

        // Mirror every save (and save deletion) to disk.
        let bridge = """
        (function () {
          const KEY = '\(saveKey)';
          const post = v => { try { window.webkit.messageHandlers.saveBridge.postMessage(v); } catch (e) {} };
          const set = Storage.prototype.setItem, rem = Storage.prototype.removeItem;
          Storage.prototype.setItem = function (k, v) { set.call(this, k, v); if (k === KEY) post(v); };
          Storage.prototype.removeItem = function (k) { rem.call(this, k); if (k === KEY) post(''); };
        })();
        """
        ucc.addUserScript(WKUserScript(source: bridge, injectionTime: .atDocumentStart, forMainFrameOnly: true))

        webView = WKWebView(frame: .zero, configuration: config)
        webView.uiDelegate = self

        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1440, height: 900),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable],
                          backing: .buffered, defer: false)
        window.title = "WiFi Billionaire"
        window.minSize = NSSize(width: 900, height: 620)
        window.contentView = webView
        window.center()
        window.setFrameAutosaveName("WiFiBillionaireMain")
        window.makeKeyAndOrderFront(nil)

        webView.load(URLRequest(url: URL(string: "wifib://app/index.html")!))
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "saveBridge", let str = message.body as? String else { return }
        let url = saveFileURL()
        if str.isEmpty { try? FileManager.default.removeItem(at: url) }
        else { try? str.data(using: .utf8)?.write(to: url, options: .atomic) }
    }

    // WKWebView drops JS alert()/confirm() unless the UI delegate implements them —
    // the game needs confirm() for prestige and hard reset.
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let a = NSAlert()
        a.messageText = "WiFi Billionaire"
        a.informativeText = message
        a.addButton(withTitle: "OK")
        a.runModal()
        completionHandler()
    }
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let a = NSAlert()
        a.messageText = "WiFi Billionaire"
        a.informativeText = message
        a.addButton(withTitle: "OK")
        a.addButton(withTitle: "Cancel")
        completionHandler(a.runModal() == .alertFirstButtonReturn)
    }
}

// ---- Bootstrap ----
let app = NSApplication.shared
app.setActivationPolicy(.regular)

let mainMenu = NSMenu()
let appItem = NSMenuItem()
mainMenu.addItem(appItem)
let appMenu = NSMenu()
appMenu.addItem(withTitle: "About WiFi Billionaire",
                action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
appMenu.addItem(.separator())
appMenu.addItem(withTitle: "Hide WiFi Billionaire", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
appMenu.addItem(.separator())
appMenu.addItem(withTitle: "Quit WiFi Billionaire", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
appItem.submenu = appMenu

let editItem = NSMenuItem()
mainMenu.addItem(editItem)
let editMenu = NSMenu(title: "Edit")
editMenu.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
editMenu.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
editMenu.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
editMenu.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
editItem.submenu = editMenu
app.mainMenu = mainMenu

let delegate = AppDelegate()
app.delegate = delegate
app.run()
