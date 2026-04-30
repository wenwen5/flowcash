import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var injectionTimers: [Timer] = []

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(orientationDidChange),
            name: UIDevice.orientationDidChangeNotification,
            object: nil
        )
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Cancel any previous timers
        injectionTimers.forEach { $0.invalidate() }
        injectionTimers.removeAll()

        // Inject repeatedly at fixed intervals — no hasInjected gate,
        // because the HTML <script> may update the variables later and
        // we want to overwrite with the exact native values.
        let delays: [TimeInterval] = [0.0, 0.20, 0.50, 1.0, 2.0]
        for delay in delays {
            let timer = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { [weak self] _ in
                self?.injectSafeAreaInsets()
            }
            injectionTimers.append(timer)
        }
    }

    @objc func orientationDidChange() {
        injectionTimers.forEach { $0.invalidate() }
        injectionTimers.removeAll()

        let delays: [TimeInterval] = [0.10, 0.30, 0.60]
        for delay in delays {
            let timer = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { [weak self] _ in
                self?.injectSafeAreaInsets()
            }
            injectionTimers.append(timer)
        }
    }

    /// Inject exact safe-area values from UIWindow into the WKWebView.
    /// The injected JS checks that document.documentElement exists before
    /// writing, so early calls (before HTML parsing) are harmless no-ops.
    func injectSafeAreaInsets() {
        guard let window = self.window else { return }

        let insets = window.safeAreaInsets
        let bottom = Int(insets.bottom)
        let top    = Int(insets.top)
        let left   = Int(insets.left)
        let right  = Int(insets.right)

        let js = """
        (function(){
            if (!document || !document.documentElement) return 'no-dom';
            var r = document.documentElement;
            r.style.setProperty('--safe-area-bottom', '\(bottom)px');
            r.style.setProperty('--safe-area-top',    '\(top)px');
            r.style.setProperty('--safe-area-left',   '\(left)px');
            r.style.setProperty('--safe-area-right',  '\(right)px');
            r.style.setProperty('--safe-area-inset-bottom', '\(bottom)px');
            r.style.setProperty('--safe-area-inset-top',    '\(top)px');
            r.style.setProperty('--safe-area-inset-left',   '\(left)px');
            r.style.setProperty('--safe-area-inset-right',  '\(right)px');
            return 'ok';
        })();
        """

        func findWebView(in view: UIView) -> WKWebView? {
            if let wv = view as? WKWebView { return wv }
            for subview in view.subviews {
                if let wv = findWebView(in: subview) { return wv }
            }
            return nil
        }

        if let webView = findWebView(in: window) {
            webView.evaluateJavaScript(js) { _, _ in
                // We intentionally ignore errors / no-dom here —
                // the next scheduled timer will retry.
            }
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {
        injectionTimers.forEach { $0.invalidate() }
        injectionTimers.removeAll()
    }
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
