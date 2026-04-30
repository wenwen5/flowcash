import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Listen for orientation changes to re-inject safe-area insets
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(orientationDidChange),
            name: UIDevice.orientationDidChangeNotification,
            object: nil
        )
        return true
    }

    /// Called every time the app becomes active (launch, foreground, rotation)
    func applicationDidBecomeActive(_ application: UIApplication) {
        injectSafeAreaInsets()
    }

    @objc func orientationDidChange() {
        // Re-calculate after a short delay so the new layout has settled
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            self?.injectSafeAreaInsets()
        }
    }

    /// Walk the view hierarchy to find the WKWebView and inject CSS safe-area variables.
    func injectSafeAreaInsets() {
        guard let window = self.window else { return }

        let insets = window.safeAreaInsets
        let bottom = Int(insets.bottom)
        let top    = Int(insets.top)
        let left   = Int(insets.left)
        let right  = Int(insets.right)

        let js = """
        (function(){
            var r = document.documentElement;
            r.style.setProperty('--safe-area-bottom', '\(bottom)px');
            r.style.setProperty('--safe-area-top',    '\(top)px');
            r.style.setProperty('--safe-area-left',   '\(left)px');
            r.style.setProperty('--safe-area-right',  '\(right)px');
            r.style.setProperty('--safe-area-inset-bottom', '\(bottom)px');
            r.style.setProperty('--safe-area-inset-top',    '\(top)px');
            r.style.setProperty('--safe-area-inset-left',   '\(left)px');
            r.style.setProperty('--safe-area-inset-right',  '\(right)px');
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
            webView.evaluateJavaScript(js, completionHandler: nil)
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
