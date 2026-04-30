import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var hasInjected = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(orientationDidChange),
            name: UIDevice.orientationDidChangeNotification,
            object: nil
        )
        return true
    }

    /// Called when the app becomes active (first launch or return from background).
    /// WKWebView may not be fully ready on first call, so we inject multiple times
    /// with increasing delays until one succeeds.
    func applicationDidBecomeActive(_ application: UIApplication) {
        hasInjected = false
        let delays: [TimeInterval] = [0.0, 0.15, 0.35, 0.60]
        for delay in delays {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
                guard let self = self, !self.hasInjected else { return }
                self.injectSafeAreaInsets()
            }
        }
    }

    @objc func orientationDidChange() {
        hasInjected = false
        // Re-calculate after layout settles, then again as insurance
        for delay in [0.2, 0.5] {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
                guard let self = self else { return }
                self.injectSafeAreaInsets()
            }
        }
    }

    /// Walk the view hierarchy to find the WKWebView and inject CSS safe-area variables.
    /// Uses a completion handler to verify the script actually executed.
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
            webView.evaluateJavaScript(js) { [weak self] result, error in
                if error == nil && result != nil {
                    self?.hasInjected = true
                }
            }
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
