import UIKit
import Capacitor
import AVFoundation
import AVKit
import CoreImage
import CoreMotion
import ImageIO
import MediaPlayer
import Metal
import Photos
import QuartzCore
import WebKit

@objc(KonoBridgeViewController)
class KonoBridgeViewController: CAPBridgeViewController {
    let cameraPreviewContainer = UIView()

    override var prefersStatusBarHidden: Bool {
        return true
    }

    override func webView(with frame: CGRect, configuration: WKWebViewConfiguration) -> WKWebView {
        let webView = WKWebView(frame: frame, configuration: configuration)
        makeWebViewTransparent(webView)
        return webView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        guard let webView else {
            return
        }

        let rootView = UIView(frame: webView.frame)
        rootView.backgroundColor = .black
        cameraPreviewContainer.backgroundColor = .black
        cameraPreviewContainer.translatesAutoresizingMaskIntoConstraints = false
        webView.translatesAutoresizingMaskIntoConstraints = false
        makeWebViewTransparent(webView)
        webView.scrollView.minimumZoomScale = 1.0
        webView.scrollView.maximumZoomScale = 1.0
        webView.scrollView.bouncesZoom = false
        setNeedsStatusBarAppearanceUpdate()

        view = rootView
        rootView.addSubview(cameraPreviewContainer)
        rootView.addSubview(webView)

        NSLayoutConstraint.activate([
            cameraPreviewContainer.leadingAnchor.constraint(equalTo: rootView.leadingAnchor),
            cameraPreviewContainer.trailingAnchor.constraint(equalTo: rootView.trailingAnchor),
            cameraPreviewContainer.topAnchor.constraint(equalTo: rootView.topAnchor),
            cameraPreviewContainer.bottomAnchor.constraint(equalTo: rootView.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: rootView.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: rootView.trailingAnchor),
            webView.topAnchor.constraint(equalTo: rootView.topAnchor),
            webView.bottomAnchor.constraint(equalTo: rootView.bottomAnchor),
        ])
    }

    private func makeWebViewTransparent(_ webView: WKWebView) {
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.layer.backgroundColor = UIColor.clear.cgColor
        webView.scrollView.backgroundColor = .clear
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        UIDevice.current.beginGeneratingDeviceOrientationNotifications()
        return true
    }

    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        return .portrait
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

@objc(KonoNativeBridgePlugin)
class KonoNativeBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "KonoNativeBridgePlugin"
    let jsName = "KonoNativeBridge"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startCamera", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopCamera", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "switchCamera", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setPreviewRect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setPreviewOffset", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setPreviewFlashOverlay", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hideStartupSplash", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setFlashEnabled", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setCropFactor", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setScreenBrightness", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hapticImpact", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startHardwareShutter", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startLevelGuide", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopLevelGuide", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "capturePhoto", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "captureAndSavePhotoStack", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "processPhoto", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "processPhotoStack", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "processAndSavePhotoStack", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "processAndSavePhoto", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reprocessGalleryItem", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "listGalleryItems", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeGalleryItem", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteGalleryItem", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveGalleryItemToPhotos", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "savePhoto", returnType: CAPPluginReturnPromise)
    ]

    private let photoAlbumTitle = "KONO CAM"
    private let cameraQueue = DispatchQueue(label: "app.konocam.native-camera")
    private let galleryQueue = DispatchQueue(label: "app.konocam.native-gallery", qos: .utility)
    private let captureSession = AVCaptureSession()
    private let photoOutput = AVCapturePhotoOutput()
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var previewShellView: UIView?
    private var previewWindowView: UIView?
    private var previewFlashOverlayView: UIView?
    private var previewOverlayView: UIImageView?
    private var startupSplashView: UIImageView?
    private weak var previewContainer: UIView?
    private var activeInput: AVCaptureDeviceInput?
    private var facingMode = "environment"
    private var flashEnabled = false
    private var previewCropFactor: CGFloat = 1.0
    private var pendingCaptureCall: CAPPluginCall?
    private var pendingCaptureMirrored = false
    private var pendingCaptureOrientation: AVCaptureVideoOrientation = .portrait
    private var pendingStackCapture: NativeStackCapture?
    private var stackCaptureProcessing = false
    private var lastCaptureVideoOrientation: AVCaptureVideoOrientation = .portrait
    private let ciContext = CIContext(options: [.workingColorSpace: CGColorSpace(name: CGColorSpace.sRGB) as Any])
    private lazy var spektraMetalRenderer: SpektraMetalRenderer? = try? SpektraMetalRenderer()
    private var spektraProfileCache: SpektraProfile?
    private var spektraFullPipelineLutCache: Data?
    private let motionManager = CMMotionManager()
    private let orientationMotionManager = CMMotionManager()
    private var lastHorizonAligned = false
    private var lastForwardAligned = false
    private var lastBothAligned = false
    private var lastLevelHapticTime = Date.distantPast
    private var lastBothLevelPulseTime = Date.distantPast
    private var levelHapticSuppressedUntil = Date.distantPast
    private var levelHorizonThreshold = 0.035
    private var levelForwardThreshold = 0.055
    private var volumeObservation: NSKeyValueObservation?
    private var volumeNotificationObserver: NSObjectProtocol?
    private var lastOutputVolume: Float?
    private var suppressVolumeObservationUntil = Date.distantPast
    private var volumeView: MPVolumeView?
    private var captureEventInteraction: UIInteraction?

    private func elapsedMs(since start: CFTimeInterval) -> Int {
        return max(0, Int((CACurrentMediaTime() - start) * 1000))
    }

    @objc override func load() {
        DispatchQueue.main.async {
            self.webView?.isOpaque = false
            self.webView?.backgroundColor = .clear
            self.webView?.layer.backgroundColor = UIColor.clear.cgColor
            self.webView?.scrollView.backgroundColor = .clear
            self.webView?.scrollView.minimumZoomScale = 1.0
            self.webView?.scrollView.maximumZoomScale = 1.0
            self.webView?.scrollView.bouncesZoom = false
            self.previewContainer = (self.bridge?.viewController as? KonoBridgeViewController)?.cameraPreviewContainer
            self.bridge?.viewController?.view.backgroundColor = .black
            self.installStartupSplash()
            self.installHiddenVolumeView()
        }
    }

    @objc func startCamera(_ call: CAPPluginCall) {
        let requestedFacingMode = call.getString("facingMode")
        let requestedFlashEnabled = call.getBool("flashEnabled", false)
        let requestedCropFactor = call.getDouble("cropFactor", 1.0)
        let requestedPreview = call.getObject("previewRect")
        let requestedShell = call.getObject("shellRect")
        let requestedOverlayPath = call.getString("overlayPath")

        AVCaptureDevice.requestAccess(for: .video) { granted in
            guard granted else {
                call.reject("Camera permission denied")
                return
            }

            self.cameraQueue.async {
                do {
                    self.facingMode = requestedFacingMode ?? self.facingMode
                    self.flashEnabled = requestedFlashEnabled
                    self.previewCropFactor = CGFloat(max(1.0, requestedCropFactor))
                    try self.configureSession(facingMode: self.facingMode)
                    self.captureSession.startRunning()
                    self.startCaptureOrientationUpdates()
                    DispatchQueue.main.async {
                        self.showPreviewLayer(requestedPreview, shellRect: requestedShell, overlayPath: requestedOverlayPath)
                        call.resolve(self.cameraState())
                    }
                } catch {
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    @objc func stopCamera(_ call: CAPPluginCall) {
        cameraQueue.async {
            guard self.pendingCaptureCall == nil && self.pendingStackCapture == nil && !self.stackCaptureProcessing else {
                DispatchQueue.main.async {
                    call.reject("Cannot stop camera while capture is in progress")
                }
                return
            }
            if self.captureSession.isRunning {
                self.captureSession.stopRunning()
            }
            self.stopCaptureOrientationUpdates()
            DispatchQueue.main.async {
                self.setCaptureEventInteractionEnabled(false)
                self.previewLayer?.removeFromSuperlayer()
                self.previewLayer = nil
                self.previewFlashOverlayView?.removeFromSuperview()
                self.previewFlashOverlayView = nil
                self.previewOverlayView?.removeFromSuperview()
                self.previewOverlayView = nil
                self.previewWindowView?.removeFromSuperview()
                self.previewWindowView = nil
                self.previewShellView?.removeFromSuperview()
                self.previewShellView = nil
                call.resolve()
            }
        }
    }

    @objc func setPreviewRect(_ call: CAPPluginCall) {
        let requestedPreview = call.getObject("previewRect")
        let requestedShell = call.getObject("shellRect")
        let requestedOverlayPath = call.getString("overlayPath")
        DispatchQueue.main.async {
            self.showPreviewLayer(requestedPreview, shellRect: requestedShell, overlayPath: requestedOverlayPath)
            call.resolve(["updated": true])
        }
    }

    @objc func setPreviewOffset(_ call: CAPPluginCall) {
        let y = call.getDouble("y", 0)
        DispatchQueue.main.async {
            let transform = CGAffineTransform(translationX: 0, y: CGFloat(y))
            if let previewShellView = self.previewShellView {
                previewShellView.transform = transform
            } else {
                self.previewWindowView?.transform = transform
            }
            call.resolve(["updated": true])
        }
    }

    @objc func setPreviewFlashOverlay(_ call: CAPPluginCall) {
        let tintVisible = call.getBool("tintVisible", false)
        let pulse = call.getBool("pulse", false)
        DispatchQueue.main.async {
            let flashOverlay = self.ensurePreviewFlashOverlay()
            flashOverlay?.alpha = tintVisible ? 0.2 : 0
            if pulse, let flashOverlay {
                UIView.animate(withDuration: 0.05, animations: {
                    flashOverlay.alpha = 0.95
                }, completion: { _ in
                    UIView.animate(withDuration: 0.22) {
                        flashOverlay.alpha = tintVisible ? 0.2 : 0
                    }
                })
            }
            call.resolve(["updated": true])
        }
    }

    @objc func hideStartupSplash(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.removeStartupSplash()
            call.resolve(["hidden": true])
        }
    }

    @objc func switchCamera(_ call: CAPPluginCall) {
        let requestedFacingMode = call.getString("facingMode")
        let requestedCropFactor = call.getDouble("cropFactor", 1.0)
        cameraQueue.async {
            guard self.pendingCaptureCall == nil else {
                DispatchQueue.main.async {
                    call.reject("Cannot switch camera while capture is in progress")
                }
                return
            }
            do {
                self.facingMode = requestedFacingMode ?? (self.facingMode == "user" ? "environment" : "user")
                self.previewCropFactor = CGFloat(max(1.0, requestedCropFactor))
                try self.configureSession(facingMode: self.facingMode)
                DispatchQueue.main.async {
                    self.applyPreviewCropFactor()
                    call.resolve(self.cameraState())
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func setFlashEnabled(_ call: CAPPluginCall) {
        let enabled = call.getBool("enabled", false)
        cameraQueue.async {
            self.flashEnabled = enabled
            DispatchQueue.main.async {
                call.resolve(self.cameraState())
            }
        }
    }

    @objc func setCropFactor(_ call: CAPPluginCall) {
        let factor = CGFloat(max(1.0, call.getDouble("factor", 1.0)))
        cameraQueue.async {
            self.previewCropFactor = factor
            DispatchQueue.main.async {
                self.applyPreviewCropFactor()
                call.resolve(["factor": Double(factor)])
            }
        }
    }

    @objc func setScreenBrightness(_ call: CAPPluginCall) {
        let brightness = CGFloat(min(1.0, max(0.0, call.getDouble("brightness", Double(UIScreen.main.brightness)))))
        DispatchQueue.main.async {
            let previousBrightness = UIScreen.main.brightness
            UIScreen.main.brightness = brightness
            call.resolve([
                "brightness": Double(UIScreen.main.brightness),
                "previousBrightness": Double(previousBrightness)
            ])
        }
    }

    @objc func hapticImpact(_ call: CAPPluginCall) {
        let styleName = call.getString("style", "medium")
        let suppressLevelMs = call.getDouble("suppressLevelMs", 0)
        DispatchQueue.main.async {
            if suppressLevelMs > 0 {
                self.levelHapticSuppressedUntil = Date().addingTimeInterval(suppressLevelMs / 1000.0)
            }
            self.fireHaptic(styleName)
            call.resolve()
        }
    }

    @objc func startHardwareShutter(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if self.installCaptureEventInteractionIfAvailable() {
                call.resolve(["enabled": true, "mode": "captureEventInteraction"])
                return
            }

            self.installHiddenVolumeView()
            do {
                try AVAudioSession.sharedInstance().setActive(true, options: [])
            } catch {
                // Volume observation can still work if another session is active.
            }
            self.lastOutputVolume = AVAudioSession.sharedInstance().outputVolume
            if self.volumeObservation == nil {
                self.volumeObservation = AVAudioSession.sharedInstance().observe(\.outputVolume, options: [.new]) { [weak self] session, change in
                    guard let self else { return }
                    self.handleHardwareVolumeChange(change.newValue ?? session.outputVolume)
                }
            }
            if self.volumeNotificationObserver == nil {
                self.volumeNotificationObserver = NotificationCenter.default.addObserver(
                    forName: Notification.Name("AVSystemController_SystemVolumeDidChangeNotification"),
                    object: nil,
                    queue: .main
                ) { [weak self] notification in
                    guard let self else { return }
                    let notificationVolume = notification.userInfo?["AVSystemController_AudioVolumeNotificationParameter"] as? Float
                    self.handleHardwareVolumeChange(notificationVolume ?? AVAudioSession.sharedInstance().outputVolume)
                }
            }
            self.recenterHardwareShutterVolume(force: false)
            call.resolve(["enabled": true, "mode": "volumeFallback"])
        }
    }

    @objc func startLevelGuide(_ call: CAPPluginCall) {
        guard motionManager.isDeviceMotionAvailable else {
            call.reject("Device motion is unavailable")
            return
        }

        applyLevelZone(call.getString("zone", "normal"))
        lastHorizonAligned = false
        lastForwardAligned = false
        lastBothAligned = false
        lastLevelHapticTime = Date.distantPast
        lastBothLevelPulseTime = Date.distantPast
        motionManager.deviceMotionUpdateInterval = 1.0 / 20.0
        motionManager.startDeviceMotionUpdates(to: OperationQueue.main) { [weak self] motion, _ in
            self?.handleLevelMotion(motion)
        }
        call.resolve(["enabled": true])
    }

    @objc func stopLevelGuide(_ call: CAPPluginCall) {
        motionManager.stopDeviceMotionUpdates()
        lastHorizonAligned = false
        lastForwardAligned = false
        lastBothAligned = false
        lastLevelHapticTime = Date.distantPast
        lastBothLevelPulseTime = Date.distantPast
        call.resolve(["enabled": false])
    }

    @objc func capturePhoto(_ call: CAPPluginCall) {
        cameraQueue.async {
            guard self.captureSession.isRunning else {
                DispatchQueue.main.async {
                    call.reject("Native camera is not running")
                }
                return
            }
            guard self.pendingCaptureCall == nil else {
                DispatchQueue.main.async {
                    call.reject("Capture already in progress")
                }
                return
            }

            let settings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])
            if self.photoOutput.supportedFlashModes.contains(.on) {
                settings.flashMode = self.flashEnabled ? .on : .off
            }
            let captureOrientation = self.currentCaptureVideoOrientationResult()
            if let connection = self.photoOutput.connection(with: .video), connection.isVideoOrientationSupported {
                connection.videoOrientation = .portrait
            }
            self.pendingCaptureOrientation = captureOrientation.orientation
            self.pendingCaptureMirrored = self.facingMode == "user"
            self.pendingCaptureCall = call
            self.photoOutput.capturePhoto(with: settings, delegate: self)
        }
    }

    @objc func captureAndSavePhotoStack(_ call: CAPPluginCall) {
        guard let lutBase64 = call.getString("lutBase64"),
              let lutData = Data(base64Encoded: lutBase64),
              let filter = call.getObject("filter"),
              let effects = call.getObject("effects") else {
            call.reject("Missing native capture stack payload")
            return
        }

        var request = NativeStackCapture(
            call: call,
            startedAt: CACurrentMediaTime(),
            lutData: lutData,
            filename: call.getString("filename", "kono-native-stack-\(Int(Date().timeIntervalSince1970 * 1000)).jpg"),
            cameraName: call.getString("cameraName", "camera"),
            intensity: max(0.0, min(1.0, call.getDouble("intensity", 1.0))),
            width: max(1, call.getInt("width", 2688)),
            height: max(1, call.getInt("height", 4032)),
            cropFactor: CGFloat(max(1.0, call.getDouble("cropFactor", 1.0))),
            mirrored: call.getBool("mirrored", false),
            filter: filter,
            effects: effects,
            importedEffects: call.getObject("importedEffects") ?? [:],
            overlaySelections: call.getObject("overlaySelections") ?? [:],
            pendingGalleryId: call.getString("pendingGalleryId", "")
        )

        cameraQueue.async {
            guard self.captureSession.isRunning else {
                DispatchQueue.main.async {
                    call.reject("Native camera is not running")
                }
                return
            }
            guard self.pendingCaptureCall == nil && self.pendingStackCapture == nil else {
                DispatchQueue.main.async {
                    call.reject("Capture already in progress")
                }
                return
            }

            let settings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])
            if self.photoOutput.supportedFlashModes.contains(.on) {
                settings.flashMode = self.flashEnabled ? .on : .off
            }
            let captureOrientation = self.currentCaptureVideoOrientationResult()
            if let connection = self.photoOutput.connection(with: .video), connection.isVideoOrientationSupported {
                connection.videoOrientation = .portrait
            }
            request.captureOrientation = captureOrientation.orientation
            request.captureOrientationSource = captureOrientation.source
            request.captureGravityX = captureOrientation.gravityX
            request.captureGravityY = captureOrientation.gravityY
            request.captureGravityZ = captureOrientation.gravityZ
            request.captureDeviceOrientation = captureOrientation.deviceOrientation
            self.pendingStackCapture = request
            self.photoOutput.capturePhoto(with: settings, delegate: self)
        }
    }

    @objc func savePhoto(_ call: CAPPluginCall) {
        guard let dataUrl = call.getString("dataUrl") else {
            call.reject("Missing dataUrl")
            return
        }

        let payload = dataUrl.components(separatedBy: ",").last ?? dataUrl
        guard let data = Data(base64Encoded: payload) else {
            call.reject("Invalid photo data")
            return
        }

        savePhotoData(data) { success, error in
            DispatchQueue.main.async {
                if success {
                    call.resolve(["saved": true])
                } else {
                    call.reject(error?.localizedDescription ?? "Unable to save photo")
                }
            }
        }
    }

    @objc func listGalleryItems(_ call: CAPPluginCall) {
        let offset = max(0, call.getInt("offset", 0))
        let limit = max(1, min(120, call.getInt("limit", 30)))
        galleryQueue.async {
            do {
                let allItems = try self.listNativeGalleryItems()
                let total = allItems.count
                let end = min(total, offset + limit)
                let items = offset < total ? Array(allItems[offset..<end]) : []
                DispatchQueue.main.async {
                    call.resolve([
                        "items": items,
                        "offset": offset,
                        "limit": limit,
                        "total": total,
                        "hasMore": end < total
                    ])
                }
            } catch {
                DispatchQueue.main.async {
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    @objc func writeGalleryItem(_ call: CAPPluginCall) {
        guard let dataUrl = call.getString("dataUrl") else {
            call.reject("Missing dataUrl")
            return
        }

        let payload = dataUrl.components(separatedBy: ",").last ?? dataUrl
        guard let data = Data(base64Encoded: payload) else {
            call.reject("Invalid gallery item data")
            return
        }

        let filename = call.getString("filename", "kono-gallery-\(Int(Date().timeIntervalSince1970 * 1000)).jpg")
        let cameraName = call.getString("cameraName", "camera")
        let originalPayload = call.getString("originalDataUrl")?.components(separatedBy: ",").last
        let originalData = originalPayload.flatMap { Data(base64Encoded: $0) }
        galleryQueue.async {
            do {
                let item = try self.writeNativeGalleryItem(data: data, filename: filename, cameraName: cameraName, originalData: originalData)
                DispatchQueue.main.async {
                    call.resolve(["item": item])
                }
            } catch {
                DispatchQueue.main.async {
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    @objc func deleteGalleryItem(_ call: CAPPluginCall) {
        guard let fileUrl = call.getString("fileUrl"),
              let url = URL(string: fileUrl),
              url.isFileURL else {
            call.resolve(["deleted": false])
            return
        }

        galleryQueue.async {
            do {
                let galleryDirectory = try self.nativeGalleryDirectory()
                let standardizedGalleryPath = galleryDirectory.standardizedFileURL.path
                let standardizedItemPath = url.standardizedFileURL.path
                guard standardizedItemPath.hasPrefix(standardizedGalleryPath) else {
                    DispatchQueue.main.async {
                        call.resolve(["deleted": false])
                    }
                    return
                }
                try self.deleteNativeGalleryFiles(for: url)
                DispatchQueue.main.async {
                    call.resolve(["deleted": true])
                }
            } catch {
                DispatchQueue.main.async {
                    call.resolve(["deleted": false])
                }
            }
        }
    }

    @objc func saveGalleryItemToPhotos(_ call: CAPPluginCall) {
        guard let fileUrl = call.getString("fileUrl"),
              let url = URL(string: fileUrl),
              url.isFileURL else {
            call.resolve(["saved": false])
            return
        }

        galleryQueue.async {
            do {
                let galleryDirectory = try self.nativeGalleryDirectory()
                let standardizedGalleryPath = galleryDirectory.standardizedFileURL.path
                let standardizedItemPath = url.standardizedFileURL.path
                guard standardizedItemPath.hasPrefix(standardizedGalleryPath),
                      FileManager.default.fileExists(atPath: url.path) else {
                    DispatchQueue.main.async {
                        call.resolve(["saved": false])
                    }
                    return
                }

                let data = try Data(contentsOf: url)
                self.savePhotoData(data) { success, error in
                    DispatchQueue.main.async {
                        if success {
                            call.resolve(["saved": true])
                        } else if let error {
                            call.reject(error.localizedDescription)
                        } else {
                            call.resolve(["saved": false])
                        }
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    @objc func processAndSavePhoto(_ call: CAPPluginCall) {
        processPhotoPayload(call, saveToLibrary: true)
    }

    @objc func processPhoto(_ call: CAPPluginCall) {
        processPhotoPayload(call, saveToLibrary: false)
    }

    @objc func processPhotoStack(_ call: CAPPluginCall) {
        let totalStart = CACurrentMediaTime()
        guard let dataUrl = call.getString("dataUrl"),
              let lutBase64 = call.getString("lutBase64"),
              let filter = call.getObject("filter"),
              let effects = call.getObject("effects") else {
            call.reject("Missing native stack payload")
            return
        }

        let filename = call.getString("filename", "kono-native-stack-\(Int(Date().timeIntervalSince1970 * 1000)).jpg")
        let intensity = max(0.0, min(1.0, call.getDouble("intensity", 1.0)))
        let width = max(1, call.getInt("width", 2688))
        let height = max(1, call.getInt("height", 4032))
        let overlaySelections = call.getObject("overlaySelections") ?? [:]
        let photoPayload = dataUrl.components(separatedBy: ",").last ?? dataUrl
        let decodeStart = CACurrentMediaTime()
        guard let photoData = Data(base64Encoded: photoPayload),
              let lutData = Data(base64Encoded: lutBase64) else {
            call.reject("Invalid native stack payload")
            return
        }
        let decodeMs = elapsedMs(since: decodeStart)

        cameraQueue.async {
            do {
                let coreImageStart = CACurrentMediaTime()
                let lutOutput = try self.processPhotoData(photoData, lutData: lutData, intensity: intensity, effects: effects)
                let coreImageMs = self.elapsedMs(since: coreImageStart)
                let overlayStart = CACurrentMediaTime()
                let stackedData = try self.renderNativeStack(
                    photoData: lutOutput,
                    width: width,
                    height: height,
                    filter: filter,
                    effects: effects,
                    importedEffects: call.getObject("importedEffects"),
                    overlaySelections: overlaySelections
                )
                let overlayMs = self.elapsedMs(since: overlayStart)
                let spektraStart = CACurrentMediaTime()
                let spektraResult = try self.applySpektraGrainIfNeeded(stackedData, importedEffects: call.getObject("importedEffects"))
                let renderedData = spektraResult.data
                let spektraMs = self.elapsedMs(since: spektraStart)
                let dataUrl = "data:image/jpeg;base64,\(renderedData.base64EncodedString())"
                DispatchQueue.main.async {
                    call.resolve([
                        "dataUrl": dataUrl,
                        "filename": filename,
                        "saved": false,
                        "metrics": [
                            "decodeMs": decodeMs,
                            "coreImageMs": coreImageMs,
                            "overlayMs": overlayMs,
                            "spektraMs": spektraMs,
                            "totalMs": self.elapsedMs(since: totalStart),
                            "inputBytes": photoData.count,
                            "jpegBytes": renderedData.count,
                            "spektraApplied": spektraResult.applied,
                            "spektraBackend": spektraResult.backend,
                            "spektraError": spektraResult.error ?? NSNull()
                        ]
                    ])
                }
            } catch {
                DispatchQueue.main.async {
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    @objc func processAndSavePhotoStack(_ call: CAPPluginCall) {
        let totalStart = CACurrentMediaTime()
        guard let dataUrl = call.getString("dataUrl"),
              let lutBase64 = call.getString("lutBase64"),
              let filter = call.getObject("filter"),
              let effects = call.getObject("effects") else {
            call.reject("Missing native stack payload")
            return
        }

        let filename = call.getString("filename", "kono-native-stack-\(Int(Date().timeIntervalSince1970 * 1000)).jpg")
        let intensity = max(0.0, min(1.0, call.getDouble("intensity", 1.0)))
        let width = max(1, call.getInt("width", 2688))
        let height = max(1, call.getInt("height", 4032))
        let overlaySelections = call.getObject("overlaySelections") ?? [:]
        let photoPayload = dataUrl.components(separatedBy: ",").last ?? dataUrl
        let decodeStart = CACurrentMediaTime()
        guard let photoData = Data(base64Encoded: photoPayload),
              let lutData = Data(base64Encoded: lutBase64) else {
            call.reject("Invalid native stack payload")
            return
        }
        let decodeMs = elapsedMs(since: decodeStart)

        cameraQueue.async {
            do {
                let coreImageStart = CACurrentMediaTime()
                let lutData = try self.processPhotoData(photoData, lutData: lutData, intensity: intensity, effects: effects)
                let coreImageMs = self.elapsedMs(since: coreImageStart)
                let overlayStart = CACurrentMediaTime()
                let stackedData = try self.renderNativeStack(
                    photoData: lutData,
                    width: width,
                    height: height,
                    filter: filter,
                    effects: effects,
                    importedEffects: call.getObject("importedEffects"),
                    overlaySelections: overlaySelections
                )
                let overlayMs = self.elapsedMs(since: overlayStart)
                let spektraStart = CACurrentMediaTime()
                let spektraResult = try self.applySpektraGrainIfNeeded(stackedData, importedEffects: call.getObject("importedEffects"))
                let renderedData = spektraResult.data
                let spektraMs = self.elapsedMs(since: spektraStart)
                let galleryWriteStart = CACurrentMediaTime()
                let galleryItem = try self.writeNativeGalleryItem(
                    data: renderedData,
                    filename: filename,
                    cameraName: call.getString("cameraName", "camera"),
                    originalData: photoData
                )
                let galleryWriteMs = self.elapsedMs(since: galleryWriteStart)
                let photosStart = CACurrentMediaTime()
                self.savePhotoData(renderedData) { success, _ in
                    let metrics: JSObject = [
                        "decodeMs": decodeMs,
                        "coreImageMs": coreImageMs,
                        "overlayMs": overlayMs,
                        "spektraMs": spektraMs,
                        "galleryWriteMs": galleryWriteMs,
                        "photosSaveMs": self.elapsedMs(since: photosStart),
                        "totalMs": self.elapsedMs(since: totalStart),
                        "inputBytes": photoData.count,
                        "jpegBytes": renderedData.count,
                        "spektraApplied": spektraResult.applied,
                        "spektraPreset": spektraResult.preset,
                        "spektraMode": spektraResult.applied ? spektraResult.mode : "",
                        "spektraBackend": spektraResult.backend,
                        "spektraFullPipelineApplied": spektraResult.fullPipelineApplied,
                        "spektraFullPipeline": spektraResult.fullPipelineApplied ? "kodak_gold_200_to_kodak_portra_endura_32_lut" : "",
                        "spektraGlare": spektraResult.applied ? [
                            "active": true,
                            "percent": 0.25,
                            "roughness": 0.70,
                            "blur": 0.50
                        ] : NSNull(),
                        "spektraError": spektraResult.error ?? NSNull()
                    ]
                    let dataUrl = "data:image/jpeg;base64,\(renderedData.base64EncodedString())"
                    DispatchQueue.main.async {
                        call.resolve([
                            "dataUrl": dataUrl,
                            "filename": filename,
                            "item": galleryItem,
                            "saved": success,
                            "metrics": metrics
                        ])
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    @objc func reprocessGalleryItem(_ call: CAPPluginCall) {
        guard let fileUrl = call.getString("fileUrl"),
              let outputURL = URL(string: fileUrl),
              outputURL.isFileURL,
              let lutBase64 = call.getString("lutBase64"),
              let lutData = Data(base64Encoded: lutBase64),
              let filter = call.getObject("filter"),
              let effects = call.getObject("effects") else {
            call.reject("Missing gallery reprocess payload")
            return
        }

        let sourceFileUrl = call.getString("originalFileUrl", fileUrl)
        guard let sourceURL = URL(string: sourceFileUrl), sourceURL.isFileURL else {
            call.reject("Missing original gallery file")
            return
        }

        let filename = call.getString("filename", outputURL.lastPathComponent)
        let cameraName = call.getString("cameraName", "camera")
        let intensity = max(0.0, min(1.0, call.getDouble("intensity", 1.0)))
        let width = max(1, call.getInt("width", 2688))
        let height = max(1, call.getInt("height", 4032))
        let overlaySelections = call.getObject("overlaySelections") ?? [:]

        galleryQueue.async {
            do {
                let galleryDirectory = try self.nativeGalleryDirectory()
                let galleryPath = galleryDirectory.standardizedFileURL.path
                guard outputURL.standardizedFileURL.path.hasPrefix(galleryPath),
                      sourceURL.standardizedFileURL.path.hasPrefix(galleryPath),
                      FileManager.default.fileExists(atPath: sourceURL.path) else {
                    throw NativeCameraError.invalidImage
                }

                let originalData = try Data(contentsOf: sourceURL)
                let lutOutput = try self.processPhotoData(originalData, lutData: lutData, intensity: intensity, effects: effects)
                let stackedData = try self.renderNativeStack(
                    photoData: lutOutput,
                    width: width,
                    height: height,
                    filter: filter,
                    effects: effects,
                    importedEffects: call.getObject("importedEffects"),
                    overlaySelections: overlaySelections
                )
                let spektraResult = try self.applySpektraGrainIfNeeded(stackedData, importedEffects: call.getObject("importedEffects"))
                let item = try self.updateNativeGalleryItem(
                    fileURL: outputURL,
                    data: spektraResult.data,
                    filename: filename,
                    cameraName: cameraName,
                    originalFileURL: sourceURL
                )
                DispatchQueue.main.async {
                    call.resolve([
                        "item": item,
                        "metrics": [
                            "spektraApplied": spektraResult.applied,
                            "spektraBackend": spektraResult.backend,
                            "spektraError": spektraResult.error ?? NSNull()
                        ]
                    ])
                }
            } catch {
                DispatchQueue.main.async {
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    private func processPhotoPayload(_ call: CAPPluginCall, saveToLibrary: Bool) {
        guard let dataUrl = call.getString("dataUrl"),
              let lutBase64 = call.getString("lutBase64") else {
            call.reject("Missing photo or LUT data")
            return
        }

        let filename = call.getString("filename", "kono-native-\(Int(Date().timeIntervalSince1970 * 1000)).jpg")
        let intensity = max(0.0, min(1.0, call.getDouble("intensity", 1.0)))
        let photoPayload = dataUrl.components(separatedBy: ",").last ?? dataUrl
        guard let photoData = Data(base64Encoded: photoPayload),
              let lutData = Data(base64Encoded: lutBase64) else {
            call.reject("Invalid native processing payload")
            return
        }

        cameraQueue.async {
            do {
                let processedData = try self.processPhotoData(photoData, lutData: lutData, intensity: intensity, effects: call.getObject("effects"))
                if !saveToLibrary {
                    let processedDataUrl = "data:image/jpeg;base64,\(processedData.base64EncodedString())"
                    DispatchQueue.main.async {
                        call.resolve([
                            "dataUrl": processedDataUrl,
                            "filename": filename,
                            "saved": false
                        ])
                    }
                    return
                }
                self.savePhotoData(processedData) { success, _ in
                    let processedDataUrl = "data:image/jpeg;base64,\(processedData.base64EncodedString())"
                    DispatchQueue.main.async {
                        call.resolve([
                            "dataUrl": processedDataUrl,
                            "filename": filename,
                            "saved": success
                        ])
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    call.reject(error.localizedDescription)
                }
            }
        }
    }

    private func processPhotoData(_ photoData: Data, lutData: Data, intensity: Double, effects: JSObject? = nil) throws -> Data {
        guard lutData.count >= 32 * 32 * 32 * 3 else {
            throw NativeCameraError.invalidLut
        }
        guard let inputImage = CIImage(data: photoData) else {
            throw NativeCameraError.invalidImage
        }

        let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
        let cubeData = makeColorCubeData(from: lutData)
        guard let lutFilter = CIFilter(name: "CIColorCubeWithColorSpace") else {
            throw NativeCameraError.invalidImage
        }
        lutFilter.setValue(32, forKey: "inputCubeDimension")
        lutFilter.setValue(cubeData, forKey: "inputCubeData")
        lutFilter.setValue(colorSpace, forKey: "inputColorSpace")
        lutFilter.setValue(inputImage, forKey: kCIInputImageKey)
        guard var outputImage = lutFilter.outputImage else {
            throw NativeCameraError.invalidImage
        }

        if intensity < 0.999, let dissolve = CIFilter(name: "CIDissolveTransition") {
            dissolve.setValue(inputImage, forKey: kCIInputImageKey)
            dissolve.setValue(outputImage, forKey: kCIInputTargetImageKey)
            dissolve.setValue(intensity, forKey: kCIInputTimeKey)
            outputImage = dissolve.outputImage ?? outputImage
        }

        outputImage = applyManualEffects(outputImage, effects: effects).cropped(to: inputImage.extent)

        let extent = inputImage.extent
        guard let cgImage = ciContext.createCGImage(outputImage.cropped(to: extent), from: extent),
              let mutableData = CFDataCreateMutable(nil, 0),
              let destination = CGImageDestinationCreateWithData(mutableData, "public.jpeg" as CFString, 1, nil) else {
            throw NativeCameraError.invalidImage
        }

        CGImageDestinationAddImage(destination, cgImage, [
            kCGImageDestinationLossyCompressionQuality: 0.98
        ] as CFDictionary)
        guard CGImageDestinationFinalize(destination) else {
            throw NativeCameraError.invalidImage
        }
        return mutableData as Data
    }

    private func makeColorCubeData(from lutData: Data) -> Data {
        var cube = [Float](repeating: 1.0, count: 32 * 32 * 32 * 4)
        lutData.withUnsafeBytes { rawBuffer in
            guard let bytes = rawBuffer.bindMemory(to: UInt8.self).baseAddress else {
                return
            }
            for blue in 0..<32 {
                for green in 0..<32 {
                    for red in 0..<32 {
                        let lutIndex = ((green * 1024) + (blue * 32) + red) * 3
                        let cubeIndex = (((blue * 32 * 32) + (green * 32) + red) * 4)
                        cube[cubeIndex] = Float(bytes[lutIndex]) / 255.0
                        cube[cubeIndex + 1] = Float(bytes[lutIndex + 1]) / 255.0
                        cube[cubeIndex + 2] = Float(bytes[lutIndex + 2]) / 255.0
                        cube[cubeIndex + 3] = 1.0
                    }
                }
            }
        }
        return cube.withUnsafeBufferPointer { Data(buffer: $0) }
    }

    private func applyManualEffects(_ image: CIImage, effects: JSObject?) -> CIImage {
        guard let effects else {
            return image
        }

        let exposure = effectValue(effects, "exposure")
        let contrast = effectValue(effects, "contrast")
        let saturation = effectValue(effects, "saturation")
        let temperature = effectValue(effects, "temperature")
        let tint = effectValue(effects, "tint")
        let fade = effectValue(effects, "fade")
        let highlight = effectValue(effects, "highlight")
        let shadow = effectValue(effects, "shadow")
        let sharpen = effectValue(effects, "sharpen")
        let disposableSoftness = effectValue(effects, "disposableSoftness")

        var output = image
        if abs(exposure) > 0.0001, let filter = CIFilter(name: "CIExposureAdjust") {
            filter.setValue(output, forKey: kCIInputImageKey)
            filter.setValue(exposure, forKey: kCIInputEVKey)
            output = filter.outputImage ?? output
        }

        if abs(contrast) > 0.0001 || abs(saturation) > 0.0001, let filter = CIFilter(name: "CIColorControls") {
            filter.setValue(output, forKey: kCIInputImageKey)
            filter.setValue(1.0 + saturation, forKey: kCIInputSaturationKey)
            filter.setValue(1.0, forKey: kCIInputBrightnessKey)
            filter.setValue(1.0 + contrast, forKey: kCIInputContrastKey)
            output = filter.outputImage ?? output
        }

        if abs(temperature) > 0.0001 || abs(tint) > 0.0001 {
            output = applyTemperatureTint(output, temperature: temperature, tint: tint)
        }

        if highlight > 0.0001 || shadow > 0.0001, let filter = CIFilter(name: "CIHighlightShadowAdjust") {
            filter.setValue(output, forKey: kCIInputImageKey)
            filter.setValue(max(0.0, 1.0 - (highlight * 0.32)), forKey: "inputHighlightAmount")
            filter.setValue(max(0.0, min(1.0, shadow * 0.72)), forKey: "inputShadowAmount")
            output = filter.outputImage ?? output
        }

        if fade > 0.0001 {
            output = applyFade(output, amount: fade)
        }

        if sharpen > 0.0001, let filter = CIFilter(name: "CISharpenLuminance") {
            filter.setValue(output, forKey: kCIInputImageKey)
            filter.setValue(sharpen * 1.6, forKey: kCIInputSharpnessKey)
            output = filter.outputImage ?? output
        }

        if disposableSoftness > 0.0001 {
            output = applyDisposableSoftness(output, amount: disposableSoftness)
        }

        return output
    }

    private func applyDisposableSoftness(_ image: CIImage, amount: Double) -> CIImage {
        let extent = image.extent
        let strength = max(0.0, min(3.0, amount)) / 3.0
        let fineRadius = 0.7 + (strength * 1.25)
        let edgeRadius = 1.6 + (strength * 2.6)

        guard let fineBlurFilter = CIFilter(name: "CIGaussianBlur"),
              let edgeBlurFilter = CIFilter(name: "CIGaussianBlur") else {
            return image
        }
        fineBlurFilter.setValue(image.clampedToExtent(), forKey: kCIInputImageKey)
        fineBlurFilter.setValue(fineRadius, forKey: kCIInputRadiusKey)
        let fineBlur = (fineBlurFilter.outputImage ?? image).cropped(to: extent)

        edgeBlurFilter.setValue(image.clampedToExtent(), forKey: kCIInputImageKey)
        edgeBlurFilter.setValue(edgeRadius, forKey: kCIInputRadiusKey)
        let edgeBlur = (edgeBlurFilter.outputImage ?? image).cropped(to: extent)

        var softened = blendImages(
            base: image,
            overlay: fineBlur,
            alpha: 0.05 + (strength * 0.11)
        ).cropped(to: extent)

        if let microFilter = CIFilter(name: "CIUnsharpMask") {
            microFilter.setValue(softened, forKey: kCIInputImageKey)
            microFilter.setValue(0.45 + (strength * 0.65), forKey: kCIInputRadiusKey)
            microFilter.setValue(-(0.10 + (strength * 0.18)), forKey: kCIInputIntensityKey)
            softened = (microFilter.outputImage ?? softened).cropped(to: extent)
        }

        let edgeMask = radialEdgeMask(extent: extent, innerRadius: 0.34, outerRadius: 0.84)
        softened = maskedBlend(base: softened, overlay: edgeBlur, mask: edgeMask, alpha: 0.12 + (strength * 0.30)).cropped(to: extent)

        return softened.cropped(to: extent)
    }

    private func blendImages(base: CIImage, overlay: CIImage, alpha: Double) -> CIImage {
        guard alpha > 0.0001 else {
            return base
        }
        guard let alphaFilter = CIFilter(name: "CIColorMatrix"),
              let blendFilter = CIFilter(name: "CISourceOverCompositing") else {
            return base
        }
        alphaFilter.setValue(overlay, forKey: kCIInputImageKey)
        alphaFilter.setValue(CIVector(x: 1, y: 0, z: 0, w: 0), forKey: "inputRVector")
        alphaFilter.setValue(CIVector(x: 0, y: 1, z: 0, w: 0), forKey: "inputGVector")
        alphaFilter.setValue(CIVector(x: 0, y: 0, z: 1, w: 0), forKey: "inputBVector")
        alphaFilter.setValue(CIVector(x: 0, y: 0, z: 0, w: max(0.0, min(1.0, alpha))), forKey: "inputAVector")
        guard let alphaImage = alphaFilter.outputImage else {
            return base
        }
        blendFilter.setValue(alphaImage, forKey: kCIInputImageKey)
        blendFilter.setValue(base, forKey: kCIInputBackgroundImageKey)
        return blendFilter.outputImage ?? base
    }

    private func maskedBlend(base: CIImage, overlay: CIImage, mask: CIImage, alpha: Double) -> CIImage {
        let fadedOverlay = blendImages(base: base, overlay: overlay, alpha: alpha)
        guard let filter = CIFilter(name: "CIBlendWithMask") else {
            return base
        }
        filter.setValue(fadedOverlay, forKey: kCIInputImageKey)
        filter.setValue(base, forKey: kCIInputBackgroundImageKey)
        filter.setValue(mask, forKey: kCIInputMaskImageKey)
        return filter.outputImage ?? base
    }

    private func radialEdgeMask(extent: CGRect, innerRadius: Double, outerRadius: Double) -> CIImage {
        let center = CIVector(x: extent.midX, y: extent.midY)
        let shortestSide = max(1.0, min(extent.width, extent.height))
        let inner = shortestSide * innerRadius
        let outer = shortestSide * outerRadius
        guard let filter = CIFilter(name: "CIRadialGradient") else {
            return CIImage(color: CIColor.white).cropped(to: extent)
        }
        filter.setValue(center, forKey: "inputCenter")
        filter.setValue(inner, forKey: "inputRadius0")
        filter.setValue(outer, forKey: "inputRadius1")
        filter.setValue(CIColor(red: 0, green: 0, blue: 0, alpha: 1), forKey: "inputColor0")
        filter.setValue(CIColor(red: 1, green: 1, blue: 1, alpha: 1), forKey: "inputColor1")
        return (filter.outputImage ?? CIImage(color: CIColor.white)).cropped(to: extent)
    }

    private func applyTemperatureTint(_ image: CIImage, temperature: Double, tint: Double) -> CIImage {
        guard let filter = CIFilter(name: "CIColorMatrix") else {
            return image
        }
        filter.setValue(image, forKey: kCIInputImageKey)
        filter.setValue(CIVector(x: 1, y: 0, z: 0, w: 0), forKey: "inputRVector")
        filter.setValue(CIVector(x: 0, y: 1, z: 0, w: 0), forKey: "inputGVector")
        filter.setValue(CIVector(x: 0, y: 0, z: 1, w: 0), forKey: "inputBVector")
        filter.setValue(CIVector(x: 0, y: 0, z: 0, w: 1), forKey: "inputAVector")
        filter.setValue(CIVector(
            x: (temperature * 0.12) + (tint * 0.05),
            y: (temperature * 0.03) + (tint * -0.08),
            z: (temperature * -0.12) + (tint * 0.05),
            w: 0
        ), forKey: "inputBiasVector")
        return filter.outputImage ?? image
    }

    private func applyFade(_ image: CIImage, amount: Double) -> CIImage {
        guard let filter = CIFilter(name: "CIColorMatrix") else {
            return image
        }
        let scale = 1.0 - (0.12 * amount)
        let bias = 0.12 * amount
        filter.setValue(image, forKey: kCIInputImageKey)
        filter.setValue(CIVector(x: scale, y: 0, z: 0, w: 0), forKey: "inputRVector")
        filter.setValue(CIVector(x: 0, y: scale, z: 0, w: 0), forKey: "inputGVector")
        filter.setValue(CIVector(x: 0, y: 0, z: scale, w: 0), forKey: "inputBVector")
        filter.setValue(CIVector(x: 0, y: 0, z: 0, w: 1), forKey: "inputAVector")
        filter.setValue(CIVector(x: bias, y: bias, z: bias, w: 0), forKey: "inputBiasVector")
        return filter.outputImage ?? image
    }

    private func renderNativeStack(
        photoData: Data,
        width: Int,
        height: Int,
        filter: JSObject,
        effects: JSObject,
        importedEffects: JSObject?,
        overlaySelections: JSObject
    ) throws -> Data {
        guard let source = UIImage(data: photoData) else {
            throw NativeCameraError.invalidImage
        }

        let size = CGSize(width: width, height: height)
        var current = renderImage(size: size) { _ in
            source.draw(in: CGRect(origin: .zero, size: size))
        }

        let overlays = filter["overlayAssets"] as? JSObject ?? [:]
        let filterId = numericInt(filter["id"])
        let filters = filter["filters"] as? [JSObject] ?? []

        current = drawBasicOverlayIfNeeded(
            current,
            paths: stringArray(overlays["grain"]) ?? ["nomo/overlays/grains_iso_400_jpg_50.jpg"],
            selection: numericInt(overlaySelections["grain"]),
            alpha: effectValue(effects, "nomoGrain") / 10.0,
            blendMode: .overlay
        )
        current = drawBasicOverlayIfNeeded(
            current,
            paths: stringArray(overlays["dust"]) ?? [
                "nomo/overlays/dust01.jpg",
                "nomo/overlays/dust02.jpg",
                "nomo/overlays/dust03.jpg"
            ],
            selection: numericInt(overlaySelections["dust"]),
            alpha: effectValue(effects, "dust") / 10.0,
            blendMode: .screen,
            flipXY: true
        )
        current = drawBasicOverlayIfNeeded(
            current,
            paths: stringArray(overlays["leak"]) ?? [
                "nomo/overlays/leak_020_g05_jpg_50_left.jpg",
                "nomo/overlays/leak_035_g69_jpg_50_left.jpg",
                "nomo/overlays/leak_040_g55_jpg_50_right.jpg",
                "nomo/overlays/leak_060_g09_jpg_50_bottom.jpg"
            ],
            selection: numericInt(overlaySelections["lightLeak"]),
            alpha: effectValue(effects, "lightLeak") / 10.0,
            blendMode: .screen
        )
        current = drawBasicOverlayIfNeeded(
            current,
            paths: stringArray(overlays["vignette"]) ?? ["nomo/overlays/vignette_020_camera_jpg_70.jpg"],
            selection: numericInt(overlaySelections["vignette"]),
            alpha: effectValue(effects, "vignette") / 10.0,
            blendMode: .multiply,
            flipXY: true
        )

        for effect in filters {
            guard let type = (effect["type"] as? String)?.lowercased() else {
                continue
            }
            if type == "frame", filterId != 51 {
                current = drawFrameEffect(current, effect: effect, filterId: filterId, overlays: overlays, stackSeed: numericInt(overlaySelections["stackTransform"]))
            } else if type == "blend" {
                current = drawBlendEffect(current, effect: effect, filterId: filterId, overlays: overlays, stackSeed: numericInt(overlaySelections["stackTransform"]))
            } else if type == "water" {
                current = drawBlendEffect(current, effect: effect, filterId: filterId, overlays: overlays, stackSeed: numericInt(overlaySelections["stackTransform"]), forcedBlendMode: .screen)
            }
        }

        guard let data = current.jpegData(compressionQuality: 0.98) else {
            throw NativeCameraError.invalidImage
        }
        return data
    }

    private func drawBasicOverlayIfNeeded(_ base: UIImage, paths: [String], selection: Int, alpha: Double, blendMode: CGBlendMode, flipXY: Bool = false) -> UIImage {
        guard alpha > 0, let overlay = loadStackImage(paths, selection: selection) else {
            return base
        }
        return renderImage(size: base.size) { context in
            base.draw(in: CGRect(origin: .zero, size: base.size))
            drawImage(overlay, in: CGRect(origin: .zero, size: base.size), context: context, blendMode: blendMode, alpha: CGFloat(alpha), flipXY: flipXY)
        }
    }

    private func drawFrameEffect(_ base: UIImage, effect: JSObject, filterId: Int, overlays: JSObject, stackSeed: Int) -> UIImage {
        guard let image = loadStackImage(stringArray(overlays["frame"]) ?? [], selection: stableOverlayIndex(effect["raw"] as? String ?? "", length: stringArray(overlays["frame"])?.count ?? 0)) else {
            return base
        }
        let params = effect["params"] as? JSObject ?? [:]
        let alpha = min(1.0, max(0.0, numericDouble(effect["value"]) ?? numericDouble(params["v"]) ?? 10.0) / 10.0)
        guard alpha > 0 else { return base }
        guard let region = parseFrameRegion(params["region"] as? String) else {
            return renderImage(size: base.size) { context in
                base.draw(in: CGRect(origin: .zero, size: base.size))
                drawImage(image, in: CGRect(origin: .zero, size: base.size), context: context, blendMode: .normal, alpha: CGFloat(alpha))
            }
        }

        if filterId == 49 || filterId == 50 {
            return renderImage(size: base.size) { context in
                base.draw(in: CGRect(origin: .zero, size: base.size))
                drawFrameCroppedToPhoto(image, region: region, baseSize: base.size, context: context, alpha: CGFloat(alpha), transform: randomizedTransform(seed: stackSeed, effect: effect))
            }
        }

        return renderImage(size: base.size) { context in
            let target = CGRect(x: region.left * base.size.width, y: region.top * base.size.height, width: region.width * base.size.width, height: region.height * base.size.height)
            drawCover(base, in: target)
            drawImage(image, in: CGRect(origin: .zero, size: base.size), context: context, blendMode: .normal, alpha: CGFloat(alpha))
        }
    }

    private func drawBlendEffect(_ base: UIImage, effect: JSObject, filterId: Int, overlays: JSObject, stackSeed: Int, forcedBlendMode: CGBlendMode? = nil) -> UIImage {
        let paths = stringArray(overlays["blend"]) ?? stringArray(overlays["water"]) ?? []
        guard let image = loadStackImage(paths, selection: stableOverlayIndex(effect["raw"] as? String ?? "", length: paths.count)) else {
            return base
        }
        let params = effect["params"] as? JSObject ?? [:]
        let alpha = min(1.0, max(0.0, numericDouble(effect["value"]) ?? numericDouble(params["v"]) ?? 10.0) / 10.0)
        guard alpha > 0 else { return base }
        let blendMode = forcedBlendMode ?? nativeBlendMode(params["mode"] as? String)
        let fillMode = (params["fillmode"] as? String)?.lowercased()
        let sourceAspectBlend = filterId == 48

        return renderImage(size: base.size) { context in
            base.draw(in: CGRect(origin: .zero, size: base.size))
            if params["replace"] as? String == "1" {
                drawImage(image, in: CGRect(origin: .zero, size: base.size), context: context, blendMode: .destinationOver, alpha: CGFloat(alpha))
            } else if sourceAspectBlend && fillMode == "fill" {
                drawCover(image, in: CGRect(origin: .zero, size: base.size), context: context, blendMode: blendMode, alpha: CGFloat(alpha), transform: randomizedTransform(seed: stackSeed, effect: effect))
            } else {
                drawImage(image, in: CGRect(origin: .zero, size: base.size), context: context, blendMode: blendMode, alpha: CGFloat(alpha), transform: randomizedTransform(seed: stackSeed, effect: effect))
            }
        }
    }

    private func renderImage(size: CGSize, actions: (CGContext) -> Void) -> UIImage {
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        format.opaque = true
        return UIGraphicsImageRenderer(size: size, format: format).image { rendererContext in
            UIColor.black.setFill()
            rendererContext.fill(CGRect(origin: .zero, size: size))
            actions(rendererContext.cgContext)
        }
    }

    private func drawImage(_ image: UIImage, in rect: CGRect, context: CGContext, blendMode: CGBlendMode, alpha: CGFloat, flipXY: Bool = false, transform: StackTransform? = nil) {
        context.saveGState()
        context.setBlendMode(blendMode)
        context.setAlpha(alpha)
        let center = CGPoint(x: rect.midX, y: rect.midY)
        context.translateBy(x: center.x, y: center.y)
        if let transform {
            context.rotate(by: CGFloat(transform.rotation) * .pi / 180)
            context.scaleBy(x: transform.flipX ? -1 : 1, y: transform.flipY ? -1 : 1)
        }
        if flipXY {
            context.scaleBy(x: -1, y: -1)
        }
        image.draw(in: CGRect(x: -rect.width / 2, y: -rect.height / 2, width: rect.width, height: rect.height), blendMode: blendMode, alpha: alpha)
        context.restoreGState()
    }

    private func drawCover(_ image: UIImage, in rect: CGRect, context: CGContext? = nil, blendMode: CGBlendMode = .normal, alpha: CGFloat = 1, transform: StackTransform? = nil) {
        let sourceRatio = image.size.width / max(1, image.size.height)
        let targetRatio = rect.width / max(1, rect.height)
        var drawRect = rect
        if sourceRatio > targetRatio {
            let width = rect.height * sourceRatio
            drawRect = CGRect(x: rect.midX - width / 2, y: rect.minY, width: width, height: rect.height)
        } else {
            let height = rect.width / sourceRatio
            drawRect = CGRect(x: rect.minX, y: rect.midY - height / 2, width: rect.width, height: height)
        }
        if let context {
            drawImage(image, in: drawRect, context: context, blendMode: blendMode, alpha: alpha, transform: transform)
        } else {
            image.draw(in: drawRect)
        }
    }

    private func drawFrameCroppedToPhoto(_ image: UIImage, region: FrameRegion, baseSize: CGSize, context: CGContext, alpha: CGFloat, transform: StackTransform?) {
        let frameSize = image.size
        let regionWidth = region.width * frameSize.width
        let regionHeight = region.height * frameSize.height
        guard regionWidth > 0, regionHeight > 0 else { return }
        let scale = max(baseSize.width / regionWidth, baseSize.height / regionHeight)
        let scaledRegionWidth = regionWidth * scale
        let scaledRegionHeight = regionHeight * scale
        let drawX = (baseSize.width - scaledRegionWidth) / 2 - region.left * frameSize.width * scale
        let drawY = (baseSize.height - scaledRegionHeight) / 2 - region.top * frameSize.height * scale
        let rect = CGRect(x: drawX, y: drawY, width: frameSize.width * scale, height: frameSize.height * scale)
        drawImage(image, in: rect, context: context, blendMode: .normal, alpha: alpha, transform: transform)
    }

    private func loadStackImage(_ paths: [String], selection: Int) -> UIImage? {
        guard !paths.isEmpty else { return nil }
        let path = paths[abs(selection) % paths.count]
        let normalizedPath = path.hasPrefix("nomo/") ? path : "nomo-cameras/\(path)"
        let url = Bundle.main.resourceURL?
            .appendingPathComponent("public")
            .appendingPathComponent(normalizedPath)
        guard let url else { return nil }
        return UIImage(contentsOfFile: url.path)
    }

    private func effectValue(_ effects: JSObject, _ key: String) -> Double {
        guard let effect = effects[key] as? JSObject else {
            return 0
        }
        return numericDouble(effect["value"]) ?? 0
    }

    private func stringArray(_ value: Any?) -> [String]? {
        if let array = value as? [String] {
            return array
        }
        if let array = value as? [Any] {
            return array.compactMap { $0 as? String }
        }
        return nil
    }

    private func numericDouble(_ value: Any?) -> Double? {
        if let value = value as? Double { return value }
        if let value = value as? Int { return Double(value) }
        if let value = value as? String { return Double(value.replacingOccurrences(of: "+", with: "")) }
        return nil
    }

    private func numericInt(_ value: Any?) -> Int {
        if let value = value as? Int { return value }
        if let value = value as? Double { return Int(value) }
        if let value = value as? String { return Int(Double(value) ?? 0) }
        return 0
    }

    private func nativeBlendMode(_ mode: String?) -> CGBlendMode {
        switch mode?.lowercased() {
        case "multiply":
            return .multiply
        case "screen":
            return .screen
        default:
            return .normal
        }
    }

    private func parseFrameRegion(_ value: String?) -> FrameRegion? {
        let values = (value ?? "").split(separator: "|").compactMap { Double($0) }
        guard values.count == 6 else { return nil }
        let sourceWidth = values[0]
        let left = values[1]
        let top = values[2]
        let sourceHeight = values[3]
        let right = values[4]
        let bottom = values[5]
        guard sourceWidth > 0, sourceHeight > 0, left + right < sourceWidth, top + bottom < sourceHeight else {
            return nil
        }
        return FrameRegion(
            left: left / sourceWidth,
            top: top / sourceHeight,
            width: (sourceWidth - left - right) / sourceWidth,
            height: (sourceHeight - top - bottom) / sourceHeight
        )
    }

    private func randomizedTransform(seed: Int, effect: JSObject) -> StackTransform? {
        guard let type = effect["type"] as? String, let raw = effect["raw"] as? String else {
            return nil
        }
        let value = "\(seed)|\(raw)|\(type)"
        let hash = stableOverlayIndex(value, length: 1024)
        return StackTransform(
            rotation: [90, 180, 270][hash % 3],
            flipX: (hash / 3) % 2 == 1,
            flipY: (hash / 6) % 2 == 1
        )
    }

    private func stableOverlayIndex(_ value: String, length: Int) -> Int {
        guard length > 0 else { return 0 }
        var hash: Int32 = 0
        for scalar in value.unicodeScalars {
            hash = hash &* 31 &+ Int32(scalar.value)
        }
        return abs(Int(hash)) % length
    }

    private struct FrameRegion {
        let left: CGFloat
        let top: CGFloat
        let width: CGFloat
        let height: CGFloat
    }

    private struct StackTransform {
        let rotation: Int
        let flipX: Bool
        let flipY: Bool
    }

    private struct SpektraProfile {
        let logExposure: [Float]
        let normalizedDensityCurves: [[Float]]
        let densityCurvesLayers: [[[Float]]]
        let densityMaxLayers: [[Float]]
    }

    private struct SpektraGrainPreset {
        let agxParticleAreaUm2: Float
        let blur: Float
        let densityMin: [Float] = [0.07, 0.08, 0.12]
        let agxParticleScale: [Float] = [0.55, 0.7, 1.1]
        let agxParticleScaleLayers: [Float] = [1.5, 0.8, 0.4]
        let uniformity: [Float] = [0.99, 0.99, 0.995]
        let blurDyeCloudsUm: Float = 0.6
        let microStructure: [Float] = [0.08, 20.0]
    }

    private struct NativeStackCapture {
        let call: CAPPluginCall
        let startedAt: CFTimeInterval
        let lutData: Data
        let filename: String
        let cameraName: String
        let intensity: Double
        let width: Int
        let height: Int
        let cropFactor: CGFloat
        let mirrored: Bool
        let filter: JSObject
        let effects: JSObject
        let importedEffects: JSObject
        let overlaySelections: JSObject
        let pendingGalleryId: String
        var captureOrientation: AVCaptureVideoOrientation = .portrait
        var captureOrientationSource: String = "initial"
        var captureGravityX: Double?
        var captureGravityY: Double?
        var captureGravityZ: Double?
        var captureDeviceOrientation: String = "unknown"
    }

    private struct CaptureOrientationResult {
        let orientation: AVCaptureVideoOrientation
        let source: String
        let gravityX: Double?
        let gravityY: Double?
        let gravityZ: Double?
        let deviceOrientation: String
    }

    private struct SpektraApplyResult {
        let data: Data
        let applied: Bool
        let preset: String
        let mode: String
        let backend: String
        let fullPipelineApplied: Bool
        let error: String?
    }

    private func applySpektraGrainIfNeeded(_ photoData: Data, importedEffects: JSObject?) throws -> SpektraApplyResult {
        guard let spektra = importedEffects?["spektraGrain"] as? JSObject,
              truthyBool(spektra["enabled"]) else {
            return SpektraApplyResult(data: photoData, applied: false, preset: "", mode: "", backend: "", fullPipelineApplied: false, error: nil)
        }

        let presetName: String
        if let incomingPreset = spektra["preset"] as? String, !incomingPreset.isEmpty {
            presetName = incomingPreset
        } else {
            presetName = "Medium"
        }
        let mode = normalizeSpektraMode(spektra["mode"] as? String)

        do {
            let pipelineData = try applySpektrafilmFullPipelineLut(to: photoData)
            guard let source = UIImage(data: pipelineData),
                  let cgImage = source.cgImage else {
                throw NativeCameraError.spektra("decode failed after full-pipeline LUT; inputBytes=\(photoData.count)")
            }

            let preset = spektraGrainPreset(named: presetName)
            let width = cgImage.width
            let height = cgImage.height
            guard width > 0, height > 0 else {
                throw NativeCameraError.spektra("invalid dimensions \(width)x\(height)")
            }
            let rgbaInput: [UInt8]
            do {
                rgbaInput = try rgbaPixels(from: cgImage, width: width, height: height)
            } catch {
                throw NativeCameraError.spektra("rgba conversion failed for \(width)x\(height): \(error.localizedDescription)")
            }
            var rgba = rgbaInput
            let backend: String
            if let metalRenderer = spektraMetalRenderer {
                do {
                    try metalRenderer.applySpektraGrainAndGlare(
                        to: &rgba,
                        width: width,
                        height: height,
                        profile: try loadSpektraProfile(),
                        preset: preset,
                        mode: mode
                    )
                    backend = "metalSpektrafilmGrain"
                } catch {
                    let profile = try loadSpektraProfile()
                    try applySpektraGrainToRgba(&rgba, width: width, height: height, profile: profile, preset: preset, mode: mode)
                    backend = "swiftCpuFallbackAfterMetalError"
                }
            } else {
                let profile = try loadSpektraProfile()
                try applySpektraGrainToRgba(&rgba, width: width, height: height, profile: profile, preset: preset, mode: mode)
                backend = "swiftCpuFallbackNoMetal"
            }
            let outputData: Data
            do {
                outputData = try jpegData(fromRgba: rgba, width: width, height: height, quality: 0.98)
            } catch {
                throw NativeCameraError.spektra("jpeg encode failed for \(width)x\(height): \(error.localizedDescription)")
            }
            guard !outputData.isEmpty else {
                throw NativeCameraError.spektra("jpeg encode returned empty data")
            }
            return SpektraApplyResult(data: outputData, applied: true, preset: presetName, mode: mode, backend: backend, fullPipelineApplied: true, error: nil)
        } catch {
            return SpektraApplyResult(
                data: photoData,
                applied: false,
                preset: presetName,
                mode: mode,
                backend: "failed",
                fullPipelineApplied: false,
                error: error.localizedDescription
            )
        }
    }

    private func normalizeSpektraMode(_ mode: String?) -> String {
        return mode == "originalDensity" ? "originalDensity" : "neutral"
    }

    private func applySpektrafilmFullPipelineLut(to photoData: Data) throws -> Data {
        let lutData = try loadSpektrafilmFullPipelineLutData()
        guard let inputImage = CIImage(data: photoData) else {
            throw NativeCameraError.spektra("full-pipeline LUT input decode failed")
        }
        let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
        let cubeData = makeColorCubeData(from: lutData)
        guard let lutFilter = CIFilter(name: "CIColorCubeWithColorSpace") else {
            throw NativeCameraError.spektra("full-pipeline LUT filter unavailable")
        }
        lutFilter.setValue(32, forKey: "inputCubeDimension")
        lutFilter.setValue(cubeData, forKey: "inputCubeData")
        lutFilter.setValue(colorSpace, forKey: "inputColorSpace")
        lutFilter.setValue(inputImage, forKey: kCIInputImageKey)
        guard let outputImage = lutFilter.outputImage?.cropped(to: inputImage.extent),
              let cgImage = ciContext.createCGImage(outputImage, from: inputImage.extent),
              let mutableData = CFDataCreateMutable(nil, 0),
              let destination = CGImageDestinationCreateWithData(mutableData, "public.jpeg" as CFString, 1, nil) else {
            throw NativeCameraError.spektra("full-pipeline LUT render failed")
        }
        CGImageDestinationAddImage(destination, cgImage, [
            kCGImageDestinationLossyCompressionQuality: 0.98
        ] as CFDictionary)
        guard CGImageDestinationFinalize(destination) else {
            throw NativeCameraError.spektra("full-pipeline LUT JPEG encode failed")
        }
        return mutableData as Data
    }

    private func loadSpektrafilmFullPipelineLutData() throws -> Data {
        if let spektraFullPipelineLutCache {
            return spektraFullPipelineLutCache
        }
        let relativePath = "public/spektrafilm/luts/kodak_gold_200_portra_endura_full_pipeline_32.rgb"
        guard let url = Bundle.main.resourceURL?.appendingPathComponent(relativePath),
              FileManager.default.fileExists(atPath: url.path) else {
            throw NativeCameraError.spektra("full-pipeline LUT missing")
        }
        let data = try Data(contentsOf: url)
        guard data.count >= 32 * 32 * 32 * 3 else {
            throw NativeCameraError.spektra("full-pipeline LUT invalid size \(data.count)")
        }
        spektraFullPipelineLutCache = data
        return data
    }

    private func hasSpektraGrainEnabled(_ importedEffects: JSObject?) -> Bool {
        guard let spektra = importedEffects?["spektraGrain"] as? JSObject else {
            return false
        }
        return truthyBool(spektra["enabled"])
    }

    private func truthyBool(_ value: Any?) -> Bool {
        if let boolValue = value as? Bool {
            return boolValue
        }
        if let numberValue = value as? NSNumber {
            return numberValue.boolValue
        }
        if let stringValue = value as? String {
            return ["true", "1", "yes", "on"].contains(stringValue.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())
        }
        return false
    }

    private func loadSpektraProfile() throws -> SpektraProfile {
        if let spektraProfileCache {
            return spektraProfileCache
        }

        let url = Bundle.main.url(
            forResource: "kodak_gold_200",
            withExtension: "json",
            subdirectory: "public/spektrafilm/profiles"
        ) ?? Bundle.main.resourceURL?.appendingPathComponent("public/spektrafilm/profiles/kodak_gold_200.json")

        guard let url else {
            throw NativeCameraError.spektra("profile file missing")
        }
        let data = try Data(contentsOf: url)
        guard let root = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw NativeCameraError.spektra("profile root is not an object")
        }
        guard let payload = root["data"] as? [String: Any] else {
            throw NativeCameraError.spektra("profile data object missing")
        }
        guard let logExposureRaw = numericArray(payload["log_exposure"]) else {
            throw NativeCameraError.spektra("profile log_exposure invalid")
        }
        guard let densityCurvesRaw = numericTable(payload["density_curves"]) else {
            throw NativeCameraError.spektra("profile density_curves invalid")
        }
        guard let densityLayersRaw = numericLayerTable(payload["density_curves_layers"]) else {
            throw NativeCameraError.spektra("profile density_curves_layers invalid")
        }
        guard !logExposureRaw.isEmpty,
              densityCurvesRaw.count == logExposureRaw.count,
              densityLayersRaw.count == logExposureRaw.count else {
            throw NativeCameraError.spektra("profile row count mismatch log=\(logExposureRaw.count) density=\(densityCurvesRaw.count) layers=\(densityLayersRaw.count)")
        }

        let logExposure = logExposureRaw.map(Float.init)
        var densityCurves = Array(repeating: [Float](), count: 3)
        for channel in 0..<3 {
            guard densityCurvesRaw.allSatisfy({ $0.count >= 3 }) else {
                throw NativeCameraError.spektra("profile density row too short")
            }
            densityCurves[channel] = densityCurvesRaw.map { row in Float(row[channel]) }
        }

        var normalizedDensityCurves = Array(repeating: [Float](), count: 3)
        for channel in 0..<3 {
            let minValue = finiteMin(densityCurves[channel])
            normalizedDensityCurves[channel] = densityCurves[channel].map { $0 - minValue }
        }

        var densityCurvesLayers = Array(
            repeating: Array(repeating: [Float](), count: 3),
            count: 3
        )
        for layer in 0..<3 {
            for channel in 0..<3 {
                guard densityLayersRaw.allSatisfy({ row in row.count >= 3 && row[layer].count >= 3 }) else {
                    throw NativeCameraError.spektra("profile layer row too short")
                }
                densityCurvesLayers[layer][channel] = densityLayersRaw.map { row in Float(row[layer][channel]) }
            }
        }

        let densityMaxLayers = densityCurvesLayers.map { layer in
            layer.map { curve in finiteMax(curve) }
        }

        let profile = SpektraProfile(
            logExposure: logExposure,
            normalizedDensityCurves: normalizedDensityCurves,
            densityCurvesLayers: densityCurvesLayers,
            densityMaxLayers: densityMaxLayers
        )
        spektraProfileCache = profile
        return profile
    }

    private func numericArray(_ value: Any?) -> [Double]? {
        if let raw = value as? [Double] {
            return raw.allSatisfy(\.isFinite) ? raw : nil
        }
        if let raw = value as? [NSNumber] {
            let output = raw.map(\.doubleValue)
            return output.allSatisfy(\.isFinite) ? output : nil
        }
        guard let raw = value as? [Any] else {
            return nil
        }
        let output = raw.compactMap(numericDouble)
        return output.count == raw.count ? output : nil
    }

    private func numericTable(_ value: Any?) -> [[Double]]? {
        guard let rows = value as? [Any] else {
            return nil
        }
        var output: [[Double]] = []
        output.reserveCapacity(rows.count)
        for row in rows {
            guard let numbers = numericArray(row) else {
                return nil
            }
            output.append(numbers)
        }
        return output
    }

    private func numericLayerTable(_ value: Any?) -> [[[Double]]]? {
        guard let rows = value as? [Any] else {
            return nil
        }
        var output: [[[Double]]] = []
        output.reserveCapacity(rows.count)
        for row in rows {
            guard let layers = numericTable(row) else {
                return nil
            }
            output.append(layers)
        }
        return output
    }

    private func numericDouble(_ value: Any) -> Double? {
        if let doubleValue = value as? Double {
            return doubleValue.isFinite ? doubleValue : nil
        }
        if let numberValue = value as? NSNumber {
            let doubleValue = numberValue.doubleValue
            return doubleValue.isFinite ? doubleValue : nil
        }
        return nil
    }

    private func spektraGrainPreset(named name: String) -> SpektraGrainPreset {
        switch name {
        case "Very Low":
            return SpektraGrainPreset(agxParticleAreaUm2: 0.05, blur: 0.8)
        case "Low":
            return SpektraGrainPreset(agxParticleAreaUm2: 2.5375, blur: 0.975)
        case "Strong":
            return SpektraGrainPreset(agxParticleAreaUm2: 7.5125, blur: 1.325)
        case "Extreme":
            return SpektraGrainPreset(agxParticleAreaUm2: 10.0, blur: 1.5)
        default:
            return SpektraGrainPreset(agxParticleAreaUm2: 5.025, blur: 1.15)
        }
    }

    private func applySpektraGrainToRgba(_ rgba: inout [UInt8], width: Int, height: Int, profile: SpektraProfile, preset: SpektraGrainPreset, mode: String) throws {
        let pixelCount = width * height
        guard rgba.count >= pixelCount * 4 else {
            throw NativeCameraError.invalidImage
        }

        let pixelSizeUm = Float(35_000.0) / Float(max(width, height))
        let densityMaxTotal = (0..<3).map { channel in
            (0..<3).reduce(Float(0)) { total, layer in total + profile.densityMaxLayers[layer][channel] }
        }

        var densityMinLayers = Array(repeating: Array(repeating: Float(0), count: 3), count: 3)
        var adjustedDensityMaxLayers = Array(repeating: Array(repeating: Float(0), count: 3), count: 3)
        var nParticlesPerPixel = Array(repeating: Array(repeating: Float(0), count: 3), count: 3)
        let pixelAreaUm2 = pixelSizeUm * pixelSizeUm

        for layer in 0..<3 {
            for channel in 0..<3 {
                let fraction = profile.densityMaxLayers[layer][channel] / max(densityMaxTotal[channel], 1e-10)
                densityMinLayers[layer][channel] = fraction * preset.densityMin[channel]
                adjustedDensityMaxLayers[layer][channel] = profile.densityMaxLayers[layer][channel] + densityMinLayers[layer][channel]
                let particleAreaLayer = preset.agxParticleAreaUm2 * preset.agxParticleScale[channel] * preset.agxParticleScaleLayers[layer]
                nParticlesPerPixel[layer][channel] = (pixelAreaUm2 * fraction) / max(particleAreaLayer, 1e-10)
            }
        }

        var linearByChannel = Array(repeating: [Float](repeating: 0, count: pixelCount), count: 3)
        var densityByChannel = Array(repeating: [Float](repeating: 0, count: pixelCount), count: 3)
        var grainedDensityByChannel = Array(repeating: [Float](repeating: 0, count: pixelCount), count: 3)

        for channel in 0..<3 {
            var linear = [Float](repeating: 0, count: pixelCount)
            var density = [Float](repeating: 0, count: pixelCount)
            for pixelIndex in 0..<pixelCount {
                let rgbaOffset = pixelIndex * 4 + channel
                let value = srgbToLinear(Float(rgba[rgbaOffset]) / 255.0)
                linear[pixelIndex] = value
                let logRaw = log10(max(value, 0) + 1e-10)
                density[pixelIndex] = interpolateScalar(logRaw, xs: profile.logExposure, ys: profile.normalizedDensityCurves[channel])
            }

            var grainedDensity = [Float](repeating: 0, count: pixelCount)
            for layer in 0..<3 {
                var plane = [Float](repeating: 0, count: pixelCount)
                for pixelIndex in 0..<pixelCount {
                    plane[pixelIndex] = interpolateScalar(
                        density[pixelIndex],
                        xs: profile.normalizedDensityCurves[channel],
                        ys: profile.densityCurvesLayers[layer][channel]
                    ) + densityMinLayers[layer][channel]
                }

                let layerGrain = spektraLayerParticleModel(
                    plane: plane,
                    width: width,
                    height: height,
                    densityMax: adjustedDensityMaxLayers[layer][channel],
                    nParticlesPerPixel: nParticlesPerPixel[layer][channel],
                    grainUniformity: preset.uniformity[channel],
                    seed: UInt32(channel + layer * 10),
                    blurParticle: preset.blurDyeCloudsUm
                )
                for pixelIndex in 0..<pixelCount {
                    grainedDensity[pixelIndex] += layerGrain[pixelIndex]
                }
            }

            addSpektraMicroStructure(
                density: &grainedDensity,
                width: width,
                height: height,
                pixelSizeUm: pixelSizeUm,
                microStructure: preset.microStructure,
                channel: channel
            )

            for pixelIndex in 0..<pixelCount {
                grainedDensity[pixelIndex] -= preset.densityMin[channel]
            }

            if preset.blur > 0 {
                grainedDensity = gaussianBlurPlane(grainedDensity, width: width, height: height, sigma: preset.blur)
            }

            linearByChannel[channel] = linear
            densityByChannel[channel] = density
            grainedDensityByChannel[channel] = grainedDensity
        }

        for pixelIndex in 0..<pixelCount {
            let neutralDeltaDensity =
                (grainedDensityByChannel[0][pixelIndex] - densityByChannel[0][pixelIndex]) * 0.2126 +
                (grainedDensityByChannel[1][pixelIndex] - densityByChannel[1][pixelIndex]) * 0.7152 +
                (grainedDensityByChannel[2][pixelIndex] - densityByChannel[2][pixelIndex]) * 0.0722
            let neutralGain = pow(10.0, -neutralDeltaDensity)
            for channel in 0..<3 {
                let channelDeltaDensity = grainedDensityByChannel[channel][pixelIndex] - densityByChannel[channel][pixelIndex]
                let channelGain = mode == "originalDensity" ? pow(10.0, -channelDeltaDensity) : neutralGain
                let transformed = clamp01(linearByChannel[channel][pixelIndex] * channelGain)
                rgba[pixelIndex * 4 + channel] = linearToSrgbByte(transformed)
            }
        }
    }

    private func spektraLayerParticleModel(
        plane: [Float],
        width: Int,
        height: Int,
        densityMax: Float,
        nParticlesPerPixel: Float,
        grainUniformity: Float,
        seed: UInt32,
        blurParticle: Float
    ) -> [Float] {
        var rng = Mulberry32(seed: seed)
        let odParticle = densityMax / max(nParticlesPerPixel, 1e-10)
        var grain = [Float](repeating: 0, count: plane.count)

        for index in 0..<plane.count {
            let probability = clamp(plane[index] / max(densityMax, 1e-10), min: 1e-6, max: 1 - 1e-6)
            let saturation = 1 - probability * grainUniformity * (1 - 1e-6)
            let lambda = (nParticlesPerPixel / max(saturation, 1e-10)) * probability
            grain[index] = Float(samplePoisson(lambda: lambda, rng: &rng)) * odParticle * saturation
        }

        guard blurParticle > 0 else {
            return grain
        }
        return gaussianBlurPlane(grain, width: width, height: height, sigma: blurParticle * sqrt(max(odParticle, 0)))
    }

    private func addSpektraMicroStructure(
        density: inout [Float],
        width: Int,
        height: Int,
        pixelSizeUm: Float,
        microStructure: [Float],
        channel: Int
    ) {
        let blurPixel = microStructure[0] / pixelSizeUm
        let sigma = (microStructure[1] * 0.001) / pixelSizeUm
        if sigma <= 0.05 {
            return
        }

        var rng = Mulberry32(seed: UInt32(1000 + channel))
        var clumping = [Float](repeating: 0, count: width * height)
        for index in 0..<clumping.count {
            clumping[index] = sampleLognormalFromMeanStd(mean: 1.0, std: sigma, rng: &rng)
        }
        if blurPixel > 0.4 {
            clumping = gaussianBlurPlane(clumping, width: width, height: height, sigma: blurPixel)
        }
        for pixelIndex in 0..<density.count {
            density[pixelIndex] *= clumping[pixelIndex]
        }
    }

    private struct Mulberry32 {
        var state: UInt32

        init(seed: UInt32) {
            state = seed
        }

        mutating func next() -> Float {
            state = state &+ 0x6d2b79f5
            var t = state
            t = (t ^ (t >> 15)) &* (t | 1)
            t ^= t &+ ((t ^ (t >> 7)) &* (t | 61))
            return Float(t ^ (t >> 14)) / 4_294_967_296.0
        }
    }

    private func gaussianBlurPlane(_ plane: [Float], width: Int, height: Int, sigma: Float) -> [Float] {
        guard sigma > 0 else {
            return plane
        }
        let radius = max(0, Int(floor(sigma * 3 + 0.5)))
        guard radius > 0 else {
            return plane
        }
        let kernel = buildGaussianKernel(radius: radius, sigma: sigma)
        var horizontal = [Float](repeating: 0, count: plane.count)
        var output = [Float](repeating: 0, count: plane.count)

        for y in 0..<height {
            for x in 0..<width {
                var sum: Float = 0
                for k in -radius...radius {
                    let sampleX = reflectIndex(x + k, size: width)
                    sum += plane[y * width + sampleX] * kernel[k + radius]
                }
                horizontal[y * width + x] = sum
            }
        }

        for y in 0..<height {
            for x in 0..<width {
                var sum: Float = 0
                for k in -radius...radius {
                    let sampleY = reflectIndex(y + k, size: height)
                    sum += horizontal[sampleY * width + x] * kernel[k + radius]
                }
                output[y * width + x] = sum
            }
        }
        return output
    }

    private func buildGaussianKernel(radius: Int, sigma: Float) -> [Float] {
        var kernel = [Float](repeating: 0, count: radius * 2 + 1)
        var sum: Float = 0
        for index in -radius...radius {
            let value = exp(-Float(index * index) / (2 * sigma * sigma))
            kernel[index + radius] = value
            sum += value
        }
        if sum > 0 {
            for index in 0..<kernel.count {
                kernel[index] /= sum
            }
        }
        return kernel
    }

    private func samplePoisson(lambda: Float, rng: inout Mulberry32) -> Int {
        if lambda <= 0 {
            return 0
        }
        if lambda < 30 {
            let limit = exp(-lambda)
            var product: Float = 1
            var count = 0
            while product > limit {
                count += 1
                product *= rng.next()
            }
            return count - 1
        }
        let sample = Int(round(lambda + sqrt(lambda) * sampleStandardNormal(rng: &rng)))
        return max(0, sample)
    }

    private func sampleLognormalFromMeanStd(mean: Float, std: Float, rng: inout Mulberry32) -> Float {
        if mean <= 0 {
            return 1
        }
        let sigma2 = log(1 + (std * std) / (mean * mean))
        let sigma = sqrt(max(0, sigma2))
        let mu = log(mean) - sigma2 / 2
        if sigma < 1e-6 {
            return exp(mu)
        }
        return exp(mu + sigma * sampleStandardNormal(rng: &rng))
    }

    private func sampleStandardNormal(rng: inout Mulberry32) -> Float {
        var u: Float = 0
        var v: Float = 0
        while u == 0 {
            u = rng.next()
        }
        while v == 0 {
            v = rng.next()
        }
        return sqrt(-2 * log(u)) * cos(2 * Float.pi * v)
    }

    private func interpolateScalar(_ value: Float, xs: [Float], ys: [Float]) -> Float {
        if value <= xs[0] {
            return ys[0]
        }
        if value >= xs[xs.count - 1] {
            return ys[ys.count - 1]
        }

        var low = 0
        var high = xs.count - 1
        while high - low > 1 {
            let mid = (low + high) >> 1
            if xs[mid] <= value {
                low = mid
            } else {
                high = mid
            }
        }

        let span = xs[high] - xs[low]
        if abs(span) < 1e-10 {
            return ys[low]
        }
        let t = (value - xs[low]) / span
        return ys[low] + (ys[high] - ys[low]) * t
    }

    private func rgbaPixels(from cgImage: CGImage, width: Int, height: Int) throws -> [UInt8] {
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        var rgba = [UInt8](repeating: 0, count: width * height * 4)
        let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
        try rgba.withUnsafeMutableBytes { rawBuffer in
            guard let baseAddress = rawBuffer.baseAddress,
                  let context = CGContext(
                    data: baseAddress,
                    width: width,
                    height: height,
                    bitsPerComponent: 8,
                    bytesPerRow: width * 4,
                    space: colorSpace,
                    bitmapInfo: bitmapInfo
                  ) else {
                throw NativeCameraError.invalidImage
            }
            context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        }
        return rgba
    }

    private func jpegData(fromRgba rgba: [UInt8], width: Int, height: Int, quality: CGFloat) throws -> Data {
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let data = Data(rgba)
        guard let provider = CGDataProvider(data: data as CFData),
              let cgImage = CGImage(
                width: width,
                height: height,
                bitsPerComponent: 8,
                bitsPerPixel: 32,
                bytesPerRow: width * 4,
                space: colorSpace,
                bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue),
                provider: provider,
                decode: nil,
                shouldInterpolate: true,
                intent: .defaultIntent
              ),
              let mutableData = CFDataCreateMutable(nil, 0),
              let destination = CGImageDestinationCreateWithData(mutableData, "public.jpeg" as CFString, 1, nil) else {
            throw NativeCameraError.invalidImage
        }
        CGImageDestinationAddImage(destination, cgImage, [
            kCGImageDestinationLossyCompressionQuality: quality
        ] as CFDictionary)
        guard CGImageDestinationFinalize(destination) else {
            throw NativeCameraError.invalidImage
        }
        return mutableData as Data
    }

    private func srgbToLinear(_ value: Float) -> Float {
        if value <= 0.04045 {
            return value / 12.92
        }
        return pow((value + 0.055) / 1.055, 2.4)
    }

    private func linearToSrgbByte(_ value: Float) -> UInt8 {
        let encoded = value <= 0.0031308
            ? value * 12.92
            : 1.055 * pow(value, 1 / 2.4) - 0.055
        return UInt8(max(0, min(255, Int(round(clamp01(encoded) * 255)))))
    }

    private func finiteMin(_ values: [Float]) -> Float {
        var output = Float.greatestFiniteMagnitude
        for value in values where value.isFinite {
            output = min(output, value)
        }
        return output.isFinite ? output : 0
    }

    private func finiteMax(_ values: [Float]) -> Float {
        var output = -Float.greatestFiniteMagnitude
        for value in values where value.isFinite {
            output = max(output, value)
        }
        return output.isFinite ? output : 0
    }

    private func clamp(_ value: Float, min minValue: Float, max maxValue: Float) -> Float {
        return Swift.min(maxValue, Swift.max(minValue, value))
    }

    private func clamp01(_ value: Float) -> Float {
        return clamp(value, min: 0, max: 1)
    }

    private func clampInt(_ value: Int, min minValue: Int, max maxValue: Int) -> Int {
        return Swift.min(maxValue, Swift.max(minValue, value))
    }

    private func reflectIndex(_ value: Int, size: Int) -> Int {
        guard size > 1 else {
            return 0
        }
        if value >= 0 && value < size {
            return value
        }
        let period = size * 2
        var reflected = value % period
        if reflected < 0 {
            reflected += period
        }
        return reflected >= size ? period - 1 - reflected : reflected
    }

    private func savePhotoData(_ data: Data, completion: @escaping (Bool, Error?) -> Void) {
        let saveToAlbum = {
            self.savePhotoDataToKonoAlbum(data) { success, error in
                if success {
                    completion(true, nil)
                } else {
                    self.savePhotoDataWithAddOnlyFallback(data, completion: completion)
                }
            }
        }

        if #available(iOS 14, *) {
            switch PHPhotoLibrary.authorizationStatus(for: .readWrite) {
            case .authorized, .limited:
                saveToAlbum()
            case .notDetermined:
                PHPhotoLibrary.requestAuthorization(for: .readWrite) { status in
                    if status == .authorized || status == .limited {
                        saveToAlbum()
                    } else {
                        self.savePhotoDataWithAddOnlyFallback(data, completion: completion)
                    }
                }
            default:
                savePhotoDataWithAddOnlyFallback(data, completion: completion)
            }
        } else {
            switch PHPhotoLibrary.authorizationStatus() {
            case .authorized:
                saveToAlbum()
            case .notDetermined:
                PHPhotoLibrary.requestAuthorization { status in
                    if status == .authorized {
                        saveToAlbum()
                    } else {
                        completion(false, nil)
                    }
                }
            default:
                completion(false, nil)
            }
        }
    }

    private func savePhotoDataToKonoAlbum(_ data: Data, completion: @escaping (Bool, Error?) -> Void) {
        let existingAlbum = fetchKonoPhotoAlbum()
        PHPhotoLibrary.shared().performChanges({
            let assetRequest = PHAssetCreationRequest.forAsset()
            assetRequest.addResource(with: .photo, data: data, options: nil)
            guard let placeholder = assetRequest.placeholderForCreatedAsset else {
                return
            }

            let albumRequest: PHAssetCollectionChangeRequest?
            if let existingAlbum {
                albumRequest = PHAssetCollectionChangeRequest(for: existingAlbum)
            } else {
                albumRequest = PHAssetCollectionChangeRequest.creationRequestForAssetCollection(withTitle: self.photoAlbumTitle)
            }
            albumRequest?.addAssets([placeholder] as NSArray)
        }) { success, error in
            completion(success, error)
        }
    }

    private func savePhotoDataWithAddOnlyFallback(_ data: Data, completion: @escaping (Bool, Error?) -> Void) {
        let saveToRecents = {
            self.savePhotoDataToRecents(data, completion: completion)
        }

        if #available(iOS 14, *) {
            switch PHPhotoLibrary.authorizationStatus(for: .addOnly) {
            case .authorized, .limited:
                saveToRecents()
            case .notDetermined:
                PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                    if status == .authorized || status == .limited {
                        saveToRecents()
                    } else {
                        completion(false, nil)
                    }
                }
            default:
                completion(false, nil)
            }
        } else {
            completion(false, nil)
        }
    }

    private func savePhotoDataToRecents(_ data: Data, completion: @escaping (Bool, Error?) -> Void) {
        PHPhotoLibrary.shared().performChanges({
            let request = PHAssetCreationRequest.forAsset()
            request.addResource(with: .photo, data: data, options: nil)
        }) { success, error in
            completion(success, error)
        }
    }

    private func fetchKonoPhotoAlbum() -> PHAssetCollection? {
        let collections = PHAssetCollection.fetchAssetCollections(with: .album, subtype: .albumRegular, options: nil)
        var matchedAlbum: PHAssetCollection?
        collections.enumerateObjects { collection, _, stop in
            if collection.localizedTitle == self.photoAlbumTitle {
                matchedAlbum = collection
                stop.pointee = true
            }
        }
        return matchedAlbum
    }

    private func nativeGalleryDirectory() throws -> URL {
        let documents = try FileManager.default.url(
            for: .documentDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        let directory = documents.appendingPathComponent("NativeGallery", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory
    }

    private func writeNativeGalleryItem(data: Data, filename: String, cameraName: String, orientation: String? = nil, originalData: Data? = nil) throws -> JSObject {
        let id = UUID().uuidString
        let safeFilename = URL(fileURLWithPath: filename).lastPathComponent.isEmpty
            ? "\(id).jpg"
            : URL(fileURLWithPath: filename).lastPathComponent
        let createdAt = Int(Date().timeIntervalSince1970 * 1000)
        let directory = try nativeGalleryDirectory()
        let fileURL = directory.appendingPathComponent("\(id)-\(safeFilename)")
        let originalURL = directory.appendingPathComponent("\(id)-original-\(safeFilename)")
        let thumbnailURL = directory.appendingPathComponent("\(id)-thumb.jpg")
        let metadataURL = directory.appendingPathComponent("\(id).json")
        try data.write(to: fileURL, options: [.atomic])
        if let originalData {
            try originalData.write(to: originalURL, options: [.atomic])
        }
        let thumbnailData = makeNativeGalleryThumbnailData(from: data)
        try thumbnailData?.write(to: thumbnailURL, options: [.atomic])
        let pixelSize = imagePixelSize(from: data)
        var item: JSObject = [
            "id": id,
            "filename": safeFilename,
            "fileUrl": fileURL.absoluteString,
            "originalFileUrl": originalData == nil ? fileURL.absoluteString : originalURL.absoluteString,
            "thumbnailFileUrl": thumbnailData == nil ? fileURL.absoluteString : thumbnailURL.absoluteString,
            "cameraName": cameraName,
            "createdAt": createdAt,
            "width": pixelSize?.width ?? NSNull(),
            "height": pixelSize?.height ?? NSNull(),
            "fileBacked": true,
            "thumbnailBacked": thumbnailData != nil,
            "processing": false,
            "source": "native"
        ]
        if let orientation {
            item["orientation"] = orientation
        }
        let metadata = try JSONSerialization.data(withJSONObject: item, options: [.prettyPrinted, .sortedKeys])
        try metadata.write(to: metadataURL, options: [.atomic])
        return item
    }

    private func updateNativeGalleryItem(fileURL: URL, data: Data, filename: String, cameraName: String, originalFileURL: URL) throws -> JSObject {
        let directory = try nativeGalleryDirectory()
        let galleryPath = directory.standardizedFileURL.path
        guard fileURL.standardizedFileURL.path.hasPrefix(galleryPath),
              originalFileURL.standardizedFileURL.path.hasPrefix(galleryPath) else {
            throw NativeCameraError.invalidImage
        }

        let id = fileURL.deletingPathExtension().lastPathComponent.components(separatedBy: "-").first ?? UUID().uuidString
        let safeFilename = URL(fileURLWithPath: filename).lastPathComponent.isEmpty ? fileURL.lastPathComponent : URL(fileURLWithPath: filename).lastPathComponent
        let thumbnailURL = directory.appendingPathComponent("\(id)-thumb.jpg")
        let metadataURL = directory.appendingPathComponent("\(id).json")
        let previousMetadata = (try? Data(contentsOf: metadataURL))
            .flatMap { try? JSONSerialization.jsonObject(with: $0) as? JSObject } ?? [:]
        let createdAt = previousMetadata["createdAt"] as? Int ?? Int(Date().timeIntervalSince1970 * 1000)

        try data.write(to: fileURL, options: [.atomic])
        let thumbnailData = makeNativeGalleryThumbnailData(from: data)
        try thumbnailData?.write(to: thumbnailURL, options: [.atomic])
        let pixelSize = imagePixelSize(from: data)
        var item: JSObject = [
            "id": id,
            "filename": safeFilename,
            "fileUrl": fileURL.absoluteString,
            "originalFileUrl": originalFileURL.absoluteString,
            "thumbnailFileUrl": thumbnailData == nil ? fileURL.absoluteString : thumbnailURL.absoluteString,
            "cameraName": cameraName,
            "createdAt": createdAt,
            "width": pixelSize?.width ?? NSNull(),
            "height": pixelSize?.height ?? NSNull(),
            "fileBacked": true,
            "thumbnailBacked": thumbnailData != nil,
            "processing": false,
            "source": "native"
        ]
        if let orientation = previousMetadata["orientation"] {
            item["orientation"] = orientation
        }
        let metadata = try JSONSerialization.data(withJSONObject: item, options: [.prettyPrinted, .sortedKeys])
        try metadata.write(to: metadataURL, options: [.atomic])
        return item
    }

    private func listNativeGalleryItems() throws -> [JSObject] {
        let directory = try nativeGalleryDirectory()
        let fileManager = FileManager.default
        let urls = try fileManager.contentsOfDirectory(
            at: directory,
            includingPropertiesForKeys: [.contentModificationDateKey],
            options: [.skipsHiddenFiles]
        )
        var items: [JSObject] = []
        let metadataURLs = urls.filter { $0.pathExtension.lowercased() == "json" }
        var metadataIds = Set<String>()

        for metadataURL in metadataURLs {
            guard let data = try? Data(contentsOf: metadataURL),
                  var item = (try? JSONSerialization.jsonObject(with: data)) as? JSObject,
                  let id = item["id"] as? String,
                  let fileUrl = item["fileUrl"] as? String,
                  let url = URL(string: fileUrl),
                  fileManager.fileExists(atPath: url.path) else {
                continue
            }
            metadataIds.insert(id)
            if let thumbnailFileUrl = item["thumbnailFileUrl"] as? String,
               let thumbnailURL = URL(string: thumbnailFileUrl),
               !fileManager.fileExists(atPath: thumbnailURL.path) {
                item["thumbnailFileUrl"] = fileUrl
            }
            if let originalFileUrl = item["originalFileUrl"] as? String,
               let originalURL = URL(string: originalFileUrl),
               !fileManager.fileExists(atPath: originalURL.path) {
                item["originalFileUrl"] = fileUrl
            }
            items.append(normalizeNativeGalleryItem(item))
        }

        for url in urls {
            let lowerName = url.lastPathComponent.lowercased()
            guard ["jpg", "jpeg"].contains(url.pathExtension.lowercased()),
                  !lowerName.contains("-thumb"),
                  !lowerName.contains("-original-") else {
                continue
            }
            let id = url.deletingPathExtension().lastPathComponent.components(separatedBy: "-").first ?? url.deletingPathExtension().lastPathComponent
            if metadataIds.contains(id) {
                continue
            }
            let resourceValues = try? url.resourceValues(forKeys: [.contentModificationDateKey])
            let createdAt = Int((resourceValues?.contentModificationDate ?? Date()).timeIntervalSince1970 * 1000)
            items.append([
                "id": id,
                "filename": url.lastPathComponent,
                "fileUrl": url.absoluteString,
                "originalFileUrl": url.absoluteString,
                "thumbnailFileUrl": url.absoluteString,
                "cameraName": cameraNameFromGalleryFilename(url.lastPathComponent) ?? "Camera",
                "createdAt": createdAt,
                "fileBacked": true,
                "thumbnailBacked": false,
                "processing": false,
                "source": "native-legacy"
            ])
        }

        return items.sorted {
            let left = $0["createdAt"] as? Int ?? 0
            let right = $1["createdAt"] as? Int ?? 0
            return left > right
        }
    }

    private func normalizeNativeGalleryItem(_ item: JSObject) -> JSObject {
        var normalized = item
        let filename = normalized["filename"] as? String ?? ""
        if normalized["cameraName"] is NSNull || (normalized["cameraName"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty != false {
            normalized["cameraName"] = cameraNameFromGalleryFilename(filename) ?? "Camera"
        }
        normalized["fileBacked"] = true
        normalized["processing"] = false
        if normalized["thumbnailFileUrl"] == nil || normalized["thumbnailFileUrl"] is NSNull {
            normalized["thumbnailFileUrl"] = normalized["fileUrl"] ?? NSNull()
            normalized["thumbnailBacked"] = false
        } else if normalized["thumbnailBacked"] == nil {
            normalized["thumbnailBacked"] = normalized["thumbnailFileUrl"] as? String != normalized["fileUrl"] as? String
        }
        if normalized["originalFileUrl"] == nil || normalized["originalFileUrl"] is NSNull {
            normalized["originalFileUrl"] = normalized["fileUrl"] ?? NSNull()
        }
        if let width = normalized["width"] as? Int,
           let height = normalized["height"] as? Int,
           width > 0,
           height > 0 {
            normalized["aspectRatio"] = Double(width) / Double(height)
            normalized["displayOrientation"] = width > height ? "landscape" : "portrait"
        }
        normalized["source"] = normalized["source"] ?? "native"
        return normalized
    }

    private func cameraNameFromGalleryFilename(_ filename: String) -> String? {
        guard let range = filename.range(of: "analoguecam-") else {
            return nil
        }
        let trimmed = String(filename[range.lowerBound...])
        let name = trimmed
            .replacingOccurrences(of: ".jpg", with: "")
            .replacingOccurrences(of: ".jpeg", with: "")
        let parts = name.components(separatedBy: "-")
        guard parts.count >= 3 else {
            return nil
        }
        let cameraParts = parts.dropFirst().dropLast()
        let cameraName = cameraParts.joined(separator: " ").trimmingCharacters(in: .whitespacesAndNewlines)
        if cameraName.range(of: #"^camera\s+\d+$"#, options: .regularExpression) != nil {
            return nil
        }
        return cameraName.isEmpty ? nil : cameraName
    }

    private func makeNativeGalleryThumbnailData(from data: Data) -> Data? {
        guard let image = UIImage(data: data) else {
            return nil
        }
        let maxSide: CGFloat = 480
        let sourceSize = image.size
        guard sourceSize.width > 0, sourceSize.height > 0 else {
            return nil
        }
        let scale = min(1, maxSide / max(sourceSize.width, sourceSize.height))
        let targetSize = CGSize(width: max(1, sourceSize.width * scale), height: max(1, sourceSize.height * scale))
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        format.opaque = true
        let rendered = UIGraphicsImageRenderer(size: targetSize, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }
        return rendered.jpegData(compressionQuality: 0.76)
    }

    private func imagePixelSize(from data: Data) -> (width: Int, height: Int)? {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil),
              let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
              let width = properties[kCGImagePropertyPixelWidth] as? NSNumber,
              let height = properties[kCGImagePropertyPixelHeight] as? NSNumber else {
            return nil
        }
        return (width: width.intValue, height: height.intValue)
    }

    private func emitSpektraPendingPreviewIfNeeded(request: NativeStackCapture, normalizedData: Data, outputSize: (width: Int, height: Int)) {
        guard !request.pendingGalleryId.isEmpty,
              hasSpektraGrainEnabled(request.importedEffects),
              let thumbnailData = makeNativeGalleryThumbnailData(from: normalizedData) else {
            return
        }

        let previewDataUrl = "data:image/jpeg;base64,\(thumbnailData.base64EncodedString())"
        let event: JSObject = [
            "id": request.pendingGalleryId,
            "filename": request.filename,
            "cameraName": request.cameraName,
            "previewDataUrl": previewDataUrl,
            "createdAt": Int(Date().timeIntervalSince1970 * 1000),
            "width": outputSize.width,
            "height": outputSize.height,
            "orientation": orientationName(request.captureOrientation)
        ]
        DispatchQueue.main.async {
            self.notifyListeners("nativeSpektraPendingPreview", data: event)
        }
    }

    private func deleteNativeGalleryFiles(for fileURL: URL) throws {
        let directory = try nativeGalleryDirectory()
        let standardizedGalleryPath = directory.standardizedFileURL.path
        let standardizedItemPath = fileURL.standardizedFileURL.path
        guard standardizedItemPath.hasPrefix(standardizedGalleryPath) else {
            return
        }

        let id = fileURL.deletingPathExtension().lastPathComponent.components(separatedBy: "-").first ?? fileURL.deletingPathExtension().lastPathComponent
        let originalURL = existingOriginalGalleryURL(directory: directory, id: id, metadataURL: directory.appendingPathComponent("\(id).json"))
        let thumbnailURL = directory.appendingPathComponent("\(id)-thumb.jpg")
        let metadataURL = directory.appendingPathComponent("\(id).json")
        let urls = [fileURL, thumbnailURL, metadataURL] + (originalURL.map { [$0] } ?? [])
        for url in urls where FileManager.default.fileExists(atPath: url.path) {
            try FileManager.default.removeItem(at: url)
        }
    }

    private func existingOriginalGalleryURL(directory: URL, id: String, metadataURL: URL) -> URL? {
        if let data = try? Data(contentsOf: metadataURL),
           let item = try? JSONSerialization.jsonObject(with: data) as? JSObject,
           let originalFileUrl = item["originalFileUrl"] as? String,
           let originalURL = URL(string: originalFileUrl),
           originalURL.isFileURL {
            return originalURL
        }

        let prefix = "\(id)-original-"
        guard let urls = try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil) else {
            return nil
        }
        return urls.first { $0.lastPathComponent.hasPrefix(prefix) }
    }

    private func configureSession(facingMode: String) throws {
        captureSession.beginConfiguration()
        captureSession.sessionPreset = .photo

        if let activeInput {
            captureSession.removeInput(activeInput)
            self.activeInput = nil
        }

        let position: AVCaptureDevice.Position = facingMode == "user" ? .front : .back
        let deviceTypes: [AVCaptureDevice.DeviceType] = [.builtInWideAngleCamera]
        let discovery = AVCaptureDevice.DiscoverySession(deviceTypes: deviceTypes, mediaType: .video, position: position)
        guard let device = discovery.devices.first else {
            captureSession.commitConfiguration()
            throw NativeCameraError.cameraUnavailable
        }

        let input = try AVCaptureDeviceInput(device: device)
        guard captureSession.canAddInput(input) else {
            captureSession.commitConfiguration()
            throw NativeCameraError.invalidSession
        }
        captureSession.addInput(input)
        activeInput = input

        if !captureSession.outputs.contains(photoOutput) {
            guard captureSession.canAddOutput(photoOutput) else {
                captureSession.commitConfiguration()
                throw NativeCameraError.invalidSession
            }
            captureSession.addOutput(photoOutput)
        }

        if let connection = photoOutput.connection(with: .video), connection.isVideoOrientationSupported {
            connection.videoOrientation = .portrait
        }

        captureSession.commitConfiguration()
    }

    private func showPreviewLayer(_ previewRect: JSObject?, shellRect: JSObject? = nil, overlayPath: String? = nil) {
        let container = previewContainer ?? (bridge?.viewController as? KonoBridgeViewController)?.cameraPreviewContainer
        guard let container else {
            return
        }

        let shellFrame = rectFromViewport(shellRect, in: container.bounds)
        let shellHost: UIView
        if let shellFrame {
            let shell = previewShellView ?? UIView(frame: shellFrame)
            shell.backgroundColor = .clear
            shell.clipsToBounds = false
            shell.frame = shellFrame
            if shell.superview !== container {
                shell.removeFromSuperview()
                container.addSubview(shell)
            }
            shell.transform = .identity
            previewShellView = shell
            shellHost = shell
        } else {
            previewShellView?.removeFromSuperview()
            previewShellView = nil
            shellHost = container
        }

        let previewWindow = previewWindowView ?? UIView(frame: shellHost.bounds)
        previewWindow.backgroundColor = .black
        previewWindow.clipsToBounds = true
        let absolutePreviewFrame = rectFromViewport(previewRect, in: container.bounds)
        let nextFrame: CGRect
        if let absolutePreviewFrame, shellHost !== container, let shellFrame {
            nextFrame = absolutePreviewFrame.offsetBy(dx: -shellFrame.minX, dy: -shellFrame.minY)
        } else {
            nextFrame = absolutePreviewFrame ?? shellHost.bounds
        }
        if nextFrame.width >= 80, nextFrame.height >= 80 {
            previewWindow.frame = nextFrame
        } else if previewWindow.frame.width < 80 || previewWindow.frame.height < 80 {
            previewWindow.frame = shellHost.bounds
        }
        if previewWindow.superview !== shellHost {
            previewWindow.removeFromSuperview()
            shellHost.addSubview(previewWindow)
        }
        previewWindow.transform = .identity
        previewWindowView = previewWindow
        if let flashOverlay = ensurePreviewFlashOverlay() {
            flashOverlay.frame = previewWindow.frame
            if flashOverlay.superview !== shellHost {
                flashOverlay.removeFromSuperview()
                shellHost.addSubview(flashOverlay)
            } else {
                shellHost.bringSubviewToFront(flashOverlay)
            }
        }

        if shellHost !== container, let overlayPath {
            let overlay = previewOverlayView ?? UIImageView(frame: shellHost.bounds)
            overlay.backgroundColor = .clear
            overlay.contentMode = .scaleToFill
            overlay.isUserInteractionEnabled = false
            overlay.frame = shellHost.bounds
            if overlay.accessibilityIdentifier != overlayPath {
                overlay.image = loadCameraOverlayImage(path: overlayPath)
                overlay.accessibilityIdentifier = overlayPath
            }
            if overlay.superview !== shellHost {
                overlay.removeFromSuperview()
                shellHost.addSubview(overlay)
            } else {
                shellHost.bringSubviewToFront(overlay)
            }
            previewOverlayView = overlay
        } else {
            previewOverlayView?.removeFromSuperview()
            previewOverlayView = nil
        }

        let isNewPreviewLayer = previewLayer == nil
        let layer = previewLayer ?? AVCaptureVideoPreviewLayer(session: captureSession)
        layer.videoGravity = .resizeAspectFill
        layer.setAffineTransform(.identity)
        layer.frame = previewWindow.bounds
        if let connection = layer.connection, connection.isVideoOrientationSupported {
            connection.videoOrientation = currentVideoOrientation()
        }
        previewLayer = layer
        applyPreviewCropFactor()
        if isNewPreviewLayer || layer.superlayer !== previewWindow.layer {
            layer.removeFromSuperlayer()
            previewWindow.layer.insertSublayer(layer, at: 0)
        } else {
            previewLayer = layer
        }
        if let startupSplashView {
            container.superview?.bringSubviewToFront(startupSplashView)
            bridge?.viewController?.view.bringSubviewToFront(startupSplashView)
        }
    }

    private func installStartupSplash() {
        guard let rootView = bridge?.viewController?.view else {
            return
        }
        let splash = startupSplashView ?? UIImageView(frame: rootView.bounds)
        splash.backgroundColor = .black
        splash.contentMode = .scaleAspectFill
        splash.isUserInteractionEnabled = false
        splash.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        splash.frame = rootView.bounds
        if splash.image == nil {
            splash.image = loadCameraOverlayImage(path: "assets/startup/kono-startup.png")
        }
        if splash.superview !== rootView {
            splash.removeFromSuperview()
            rootView.addSubview(splash)
        }
        rootView.bringSubviewToFront(splash)
        startupSplashView = splash
    }

    private func removeStartupSplash() {
        UIView.animate(withDuration: 0.12, animations: {
            self.startupSplashView?.alpha = 0
        }, completion: { _ in
            self.startupSplashView?.removeFromSuperview()
            self.startupSplashView = nil
        })
    }

    private func ensurePreviewFlashOverlay() -> UIView? {
        guard let previewWindow = previewWindowView,
              let shellHost = previewWindow.superview else {
            return nil
        }
        let flashOverlay = previewFlashOverlayView ?? UIView(frame: previewWindow.frame)
        flashOverlay.backgroundColor = .white
        flashOverlay.isUserInteractionEnabled = false
        if previewFlashOverlayView == nil {
            flashOverlay.alpha = 0
        }
        if flashOverlay.superview !== shellHost {
            flashOverlay.removeFromSuperview()
            shellHost.addSubview(flashOverlay)
        }
        previewFlashOverlayView = flashOverlay
        return flashOverlay
    }

    private func loadCameraOverlayImage(path: String) -> UIImage? {
        let cleaned = path
            .replacingOccurrences(of: "capacitor://localhost/", with: "")
            .replacingOccurrences(of: "./", with: "")
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard !cleaned.isEmpty else {
            return nil
        }

        let candidates = [
            "public/\(cleaned)",
            cleaned
        ]
        for candidate in candidates {
            if let url = Bundle.main.url(forResource: candidate, withExtension: nil),
               let image = UIImage(contentsOfFile: url.path) {
                return image
            }
            if let resourcePath = Bundle.main.resourcePath {
                let filePath = URL(fileURLWithPath: resourcePath).appendingPathComponent(candidate).path
                if FileManager.default.fileExists(atPath: filePath),
                   let image = UIImage(contentsOfFile: filePath) {
                    return image
                }
            }
        }
        return nil
    }

    private func applyPreviewCropFactor() {
        guard let previewLayer,
              let previewWindow = previewWindowView else {
            return
        }

        let bounds = previewWindow.bounds
        let factor = max(1.0, previewCropFactor)
        let extraWidth = bounds.width * (factor - 1.0)
        let extraHeight = bounds.height * (factor - 1.0)
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        previewLayer.setAffineTransform(.identity)
        previewLayer.frame = bounds.insetBy(dx: -extraWidth / 2.0, dy: -extraHeight / 2.0)
        CATransaction.commit()
    }

    private func rectFromViewport(_ rect: JSObject?, in bounds: CGRect) -> CGRect? {
        guard let rect,
              let x = rect["x"] as? Double,
              let y = rect["y"] as? Double,
              let width = rect["width"] as? Double,
              let height = rect["height"] as? Double,
              width >= 80,
              height >= 80 else {
            return nil
        }
        let scale = UIScreen.main.scale
        let next = CGRect(x: x / scale, y: y / scale, width: width / scale, height: height / scale).intersection(bounds)
        guard next.width >= 80, next.height >= 80 else {
            return nil
        }
        return next
    }

    private func cameraState() -> [String: Any] {
        let device = activeInput?.device
        return [
            "native": true,
            "facingMode": facingMode,
            "flashSupported": device?.hasFlash ?? false,
            "width": 2688,
            "height": 4032
        ]
    }

    private func currentVideoOrientation() -> AVCaptureVideoOrientation {
        return .portrait
    }

    private func installHiddenVolumeView() {
        guard volumeView == nil, let hostView = bridge?.viewController?.view else {
            if let volumeView, let hostView = bridge?.viewController?.view, volumeView.superview !== hostView {
                volumeView.removeFromSuperview()
                hostView.addSubview(volumeView)
            }
            return
        }

        let volumeView = MPVolumeView(frame: CGRect(x: -1000, y: -1000, width: 1, height: 1))
        volumeView.alpha = 0.01
        volumeView.isUserInteractionEnabled = false
        hostView.addSubview(volumeView)
        self.volumeView = volumeView
    }

    private func hiddenVolumeSlider() -> UISlider? {
        guard let volumeView else {
            return nil
        }

        return volumeView.subviews.compactMap { $0 as? UISlider }.first
    }

    private func installCaptureEventInteractionIfAvailable() -> Bool {
        guard #available(iOS 17.2, *) else {
            return false
        }
        guard let hostView = bridge?.viewController?.view else {
            return false
        }

        if let existing = captureEventInteraction as? AVCaptureEventInteraction {
            existing.isEnabled = true
            return true
        }

        let interaction = AVCaptureEventInteraction { [weak self] event in
            guard let self else {
                return
            }
            guard event.phase == .ended else {
                return
            }
            guard self.captureSession.isRunning,
                  self.pendingCaptureCall == nil,
                  self.pendingStackCapture == nil else {
                return
            }
            self.notifyListeners("hardwareShutter", data: ["source": "captureEventInteraction"])
        }
        interaction.isEnabled = true
        hostView.addInteraction(interaction)
        captureEventInteraction = interaction
        return true
    }

    private func setCaptureEventInteractionEnabled(_ enabled: Bool) {
        if #available(iOS 17.2, *),
           let interaction = captureEventInteraction as? AVCaptureEventInteraction {
            interaction.isEnabled = enabled
        }
    }

    private func handleHardwareVolumeChange(_ newVolume: Float) {
        if Date() < suppressVolumeObservationUntil {
            lastOutputVolume = newVolume
            return
        }
        if let lastOutputVolume, abs(newVolume - lastOutputVolume) < 0.001 {
            return
        }
        lastOutputVolume = newVolume
        DispatchQueue.main.async {
            self.notifyListeners("hardwareShutter", data: ["source": "volume"])
            self.recenterHardwareShutterVolume(force: true)
        }
    }

    private func recenterHardwareShutterVolume(force: Bool) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
            let currentVolume = AVAudioSession.sharedInstance().outputVolume
            guard force || currentVolume < 0.08 || currentVolume > 0.92 else {
                return
            }

            guard let slider = self.hiddenVolumeSlider() else {
                return
            }

            self.suppressVolumeObservationUntil = Date().addingTimeInterval(0.45)
            slider.setValue(0.5, animated: false)
            slider.sendActions(for: .touchUpInside)
        }
    }

    private func applyLevelZone(_ zone: String) {
        switch zone {
        case "precise":
            levelHorizonThreshold = 0.022
            levelForwardThreshold = 0.035
        case "wide":
            levelHorizonThreshold = 0.060
            levelForwardThreshold = 0.095
        default:
            levelHorizonThreshold = 0.035
            levelForwardThreshold = 0.055
        }
    }

    private func handleLevelMotion(_ motion: CMDeviceMotion?) {
        guard let gravity = motion?.gravity else {
            return
        }

        let horizonRatio = min(abs(gravity.x), abs(gravity.y)) / levelHorizonThreshold
        let forwardRatio = abs(gravity.z) / levelForwardThreshold
        let worstRatio = max(horizonRatio, forwardRatio)
        let horizonAligned = horizonRatio < 1.0
        let forwardAligned = forwardRatio < 1.0
        let bothAligned = horizonAligned && forwardAligned
        let now = Date()
        guard now >= levelHapticSuppressedUntil else {
            lastHorizonAligned = horizonAligned
            lastForwardAligned = forwardAligned
            lastBothAligned = bothAligned
            return
        }

        let pulseInterval: TimeInterval
        if bothAligned {
            pulseInterval = 0.12
        } else {
            let outerRatio = 2.15
            guard worstRatio <= outerRatio else {
                lastHorizonAligned = horizonAligned
                lastForwardAligned = forwardAligned
                lastBothAligned = bothAligned
                return
            }
            let rawCloseness = max(0.0, min(1.0, (outerRatio - worstRatio) / (outerRatio - 1.0)))
            let easedCloseness = pow(rawCloseness, 1.85)
            pulseInterval = 1.15 - (0.88 * easedCloseness)
        }

        if now.timeIntervalSince(lastLevelHapticTime) >= pulseInterval {
            lastLevelHapticTime = now
            if bothAligned {
                lastBothLevelPulseTime = now
            }
            fireHaptic("soft")
        }

        if bothAligned {
            lastHorizonAligned = horizonAligned
            lastForwardAligned = forwardAligned
            lastBothAligned = bothAligned
            return
        }

        lastHorizonAligned = horizonAligned
        lastForwardAligned = forwardAligned
        lastBothAligned = bothAligned
    }

    private func fireHaptic(_ styleName: String) {
        let style: UIImpactFeedbackGenerator.FeedbackStyle
        switch styleName {
        case "light":
            style = .light
        case "heavy":
            style = .heavy
        case "soft":
            if #available(iOS 13.0, *) {
                style = .soft
            } else {
                style = .light
            }
        case "rigid":
            if #available(iOS 13.0, *) {
                style = .rigid
            } else {
                style = .medium
            }
        default:
            style = .medium
        }
        UIImpactFeedbackGenerator(style: style).impactOccurred()
    }

    private func currentCaptureVideoOrientation() -> AVCaptureVideoOrientation {
        return currentCaptureVideoOrientationResult().orientation
    }

    private func currentCaptureVideoOrientationResult() -> CaptureOrientationResult {
        let deviceOrientation = UIDevice.current.orientation
        let deviceName = deviceOrientationName(deviceOrientation)
        let gravity = orientationMotionManager.deviceMotion?.gravity

        if let motionOrientation = videoOrientationFromGravity(gravity) {
            lastCaptureVideoOrientation = motionOrientation
            return CaptureOrientationResult(
                orientation: motionOrientation,
                source: "motion",
                gravityX: gravity?.x,
                gravityY: gravity?.y,
                gravityZ: gravity?.z,
                deviceOrientation: deviceName
            )
        }

        if let deviceVideoOrientation = videoOrientationFromDeviceOrientation(deviceOrientation) {
            lastCaptureVideoOrientation = deviceVideoOrientation
            return CaptureOrientationResult(
                orientation: deviceVideoOrientation,
                source: "device",
                gravityX: gravity?.x,
                gravityY: gravity?.y,
                gravityZ: gravity?.z,
                deviceOrientation: deviceName
            )
        }

        return CaptureOrientationResult(
            orientation: lastCaptureVideoOrientation,
            source: "cached",
            gravityX: gravity?.x,
            gravityY: gravity?.y,
            gravityZ: gravity?.z,
            deviceOrientation: deviceName
        )
    }

    private func startCaptureOrientationUpdates() {
        guard orientationMotionManager.isDeviceMotionAvailable, !orientationMotionManager.isDeviceMotionActive else {
            return
        }
        orientationMotionManager.deviceMotionUpdateInterval = 1.0 / 20.0
        orientationMotionManager.startDeviceMotionUpdates()
    }

    private func stopCaptureOrientationUpdates() {
        if orientationMotionManager.isDeviceMotionActive {
            orientationMotionManager.stopDeviceMotionUpdates()
        }
    }

    private func videoOrientationFromDeviceOrientation(_ orientation: UIDeviceOrientation) -> AVCaptureVideoOrientation? {
        switch orientation {
        case .landscapeLeft:
            return .landscapeRight
        case .landscapeRight:
            return .landscapeLeft
        case .portraitUpsideDown:
            return .portraitUpsideDown
        case .portrait:
            return .portrait
        default:
            return nil
        }
    }

    private func videoOrientationFromGravity(_ gravity: CMAcceleration?) -> AVCaptureVideoOrientation? {
        guard let gravity else {
            return nil
        }

        let x = gravity.x
        let y = gravity.y
        let absX = abs(x)
        let absY = abs(y)
        guard max(absX, absY) >= 0.42 else {
            return nil
        }

        if absX >= absY + 0.08 {
            return x > 0 ? .landscapeLeft : .landscapeRight
        }
        if absY >= absX + 0.08 {
            return y > 0 ? .portraitUpsideDown : .portrait
        }
        return nil
    }

    private func deviceOrientationName(_ orientation: UIDeviceOrientation) -> String {
        switch orientation {
        case .portrait:
            return "portrait"
        case .portraitUpsideDown:
            return "portraitUpsideDown"
        case .landscapeLeft:
            return "landscapeLeft"
        case .landscapeRight:
            return "landscapeRight"
        case .faceUp:
            return "faceUp"
        case .faceDown:
            return "faceDown"
        case .unknown:
            return "unknown"
        @unknown default:
            return "unknown"
        }
    }

    private func normalizedJpegData(from data: Data) -> Data {
        guard let image = UIImage(data: data) else {
            return data
        }

        let targetSize = image.size
        let renderer = UIGraphicsImageRenderer(size: targetSize)
        let rendered = renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }
        return rendered.jpegData(compressionQuality: 0.98) ?? data
    }

    private func normalizedCaptureData(from data: Data, width: Int, height: Int, cropFactor: CGFloat, mirrored: Bool, orientation: AVCaptureVideoOrientation) throws -> Data {
        guard let image = UIImage(data: data) else {
            throw NativeCameraError.invalidImage
        }

        let portraitSize = CGSize(width: width, height: height)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        format.opaque = true
        let portraitImage = UIGraphicsImageRenderer(size: portraitSize, format: format).image { rendererContext in
            UIColor.black.setFill()
            rendererContext.fill(CGRect(origin: .zero, size: portraitSize))
            let context = rendererContext.cgContext
            context.saveGState()
            let logicalRect = CGRect(origin: .zero, size: portraitSize)
            if mirrored {
                context.translateBy(x: logicalRect.width, y: 0)
                context.scaleBy(x: -1, y: 1)
            }
            drawCover(image, in: logicalRect, cropFactor: cropFactor)
            context.restoreGState()
        }

        let rendered = rotateNormalizedCaptureIfNeeded(portraitImage, orientation: orientation, format: format)
        guard let output = rendered.jpegData(compressionQuality: 0.98) else {
            throw NativeCameraError.invalidImage
        }
        return output
    }

    private func rotateNormalizedCaptureIfNeeded(_ image: UIImage, orientation: AVCaptureVideoOrientation, format: UIGraphicsImageRendererFormat) -> UIImage {
        let size = image.size
        switch orientation {
        case .landscapeLeft:
            let targetSize = CGSize(width: size.height, height: size.width)
            return UIGraphicsImageRenderer(size: targetSize, format: format).image { rendererContext in
                let context = rendererContext.cgContext
                context.translateBy(x: targetSize.width, y: 0)
                context.rotate(by: .pi / 2)
                image.draw(in: CGRect(origin: .zero, size: size))
            }
        case .landscapeRight:
            let targetSize = CGSize(width: size.height, height: size.width)
            return UIGraphicsImageRenderer(size: targetSize, format: format).image { rendererContext in
                let context = rendererContext.cgContext
                context.translateBy(x: 0, y: targetSize.height)
                context.rotate(by: -.pi / 2)
                image.draw(in: CGRect(origin: .zero, size: size))
            }
        case .portraitUpsideDown:
            return UIGraphicsImageRenderer(size: size, format: format).image { rendererContext in
                let context = rendererContext.cgContext
                context.translateBy(x: size.width, y: size.height)
                context.rotate(by: .pi)
                image.draw(in: CGRect(origin: .zero, size: size))
            }
        default:
            return image
        }
    }

    private func orientedOutputSize(width: Int, height: Int, orientation: AVCaptureVideoOrientation) -> (width: Int, height: Int) {
        switch orientation {
        case .landscapeLeft, .landscapeRight:
            return (width: height, height: width)
        default:
            return (width: width, height: height)
        }
    }

    private func orientationName(_ orientation: AVCaptureVideoOrientation) -> String {
        switch orientation {
        case .portrait:
            return "portrait"
        case .portraitUpsideDown:
            return "portraitUpsideDown"
        case .landscapeLeft:
            return "landscapeLeft"
        case .landscapeRight:
            return "landscapeRight"
        @unknown default:
            return "unknown"
        }
    }

    private func drawCover(_ image: UIImage, in rect: CGRect, cropFactor: CGFloat) {
        let sourceRatio = image.size.width / max(1, image.size.height)
        let targetRatio = rect.width / max(1, rect.height)
        var drawRect = rect
        if sourceRatio > targetRatio {
            let width = rect.height * sourceRatio
            drawRect = CGRect(x: rect.midX - width / 2, y: rect.minY, width: width, height: rect.height)
        } else {
            let height = rect.width / sourceRatio
            drawRect = CGRect(x: rect.minX, y: rect.midY - height / 2, width: rect.width, height: height)
        }

        let factor = max(1, cropFactor)
        if factor > 1 {
            let zoomedWidth = drawRect.width * factor
            let zoomedHeight = drawRect.height * factor
            drawRect = CGRect(
                x: drawRect.midX - zoomedWidth / 2,
                y: drawRect.midY - zoomedHeight / 2,
                width: zoomedWidth,
                height: zoomedHeight
            )
        }
        image.draw(in: drawRect)
    }

    private final class SpektraMetalRenderer {
        private struct Params {
            var width: UInt32
            var height: UInt32
            var strength: Float
            var roughness: Float
            var glarePercent: Float
            var glareRoughness: Float
            var glareBlur: Float
            var mode: UInt32
            var seed: UInt32
            var pixelSizeUm: Float = 1.0
            var densityMin0: Float = 0.07
            var densityMin1: Float = 0.08
            var densityMin2: Float = 0.12
            var uniformity0: Float = 0.99
            var uniformity1: Float = 0.99
            var uniformity2: Float = 0.995
            var finalBlur: Float = 1.0
            var dyeCloudBlur: Float = 0.6
            var microAmount: Float = 0.08
            var microSigma: Float = 20.0
            var dmax00: Float = 1.0
            var dmax01: Float = 1.0
            var dmax02: Float = 1.0
            var dmax10: Float = 1.0
            var dmax11: Float = 1.0
            var dmax12: Float = 1.0
            var dmax20: Float = 1.0
            var dmax21: Float = 1.0
            var dmax22: Float = 1.0
            var npp00: Float = 64.0
            var npp01: Float = 64.0
            var npp02: Float = 64.0
            var npp10: Float = 64.0
            var npp11: Float = 64.0
            var npp12: Float = 64.0
            var npp20: Float = 64.0
            var npp21: Float = 64.0
            var npp22: Float = 64.0
        }

        private let device: MTLDevice
        private let commandQueue: MTLCommandQueue
        private let pipeline: MTLComputePipelineState

        init() throws {
            guard let device = MTLCreateSystemDefaultDevice(),
                  let commandQueue = device.makeCommandQueue() else {
                throw NativeCameraError.spektra("Metal device unavailable")
            }
            let library = try device.makeLibrary(source: Self.shaderSource, options: nil)
            guard let function = library.makeFunction(name: "spektra_grain_glare") else {
                throw NativeCameraError.spektra("Metal kernel missing")
            }
            self.device = device
            self.commandQueue = commandQueue
            self.pipeline = try device.makeComputePipelineState(function: function)
        }

        func applySpektraGrainAndGlare(
            to rgba: inout [UInt8],
            width: Int,
            height: Int,
            profile: SpektraProfile,
            preset: SpektraGrainPreset,
            mode: String
        ) throws {
            let byteCount = width * height * 4
            guard width > 0, height > 0, rgba.count >= byteCount else {
                throw NativeCameraError.invalidImage
            }
            guard let input = device.makeBuffer(bytes: rgba, length: byteCount, options: .storageModeShared),
                  let output = device.makeBuffer(length: byteCount, options: .storageModeShared),
                  let commandBuffer = commandQueue.makeCommandBuffer(),
                  let encoder = commandBuffer.makeComputeCommandEncoder() else {
                throw NativeCameraError.spektra("Metal buffer setup failed")
            }

            var params = Params(
                width: UInt32(width),
                height: UInt32(height),
                strength: metalStrength(for: preset),
                roughness: 0.70,
                glarePercent: 0.25,
                glareRoughness: 0.70,
                glareBlur: 0.50,
                mode: mode == "originalDensity" ? 1 : 0,
                seed: UInt32(Date().timeIntervalSince1970.truncatingRemainder(dividingBy: 100_000) * 1000)
            )
            applySpektrafilmGrainConstants(to: &params, profile: profile, preset: preset, width: width, height: height)

            encoder.setComputePipelineState(pipeline)
            encoder.setBuffer(input, offset: 0, index: 0)
            encoder.setBuffer(output, offset: 0, index: 1)
            encoder.setBytes(&params, length: MemoryLayout<Params>.stride, index: 2)
            let side = pipeline.maxTotalThreadsPerThreadgroup >= 256 ? 16 : 8
            let threadsPerGroup = MTLSize(width: side, height: side, depth: 1)
            let groups = MTLSize(
                width: (width + threadsPerGroup.width - 1) / threadsPerGroup.width,
                height: (height + threadsPerGroup.height - 1) / threadsPerGroup.height,
                depth: 1
            )
            encoder.dispatchThreadgroups(groups, threadsPerThreadgroup: threadsPerGroup)
            encoder.endEncoding()
            commandBuffer.commit()
            commandBuffer.waitUntilCompleted()
            if let error = commandBuffer.error {
                throw NativeCameraError.spektra("Metal command failed: \(error.localizedDescription)")
            }

            let outputPointer = output.contents().bindMemory(to: UInt8.self, capacity: byteCount)
            rgba.replaceSubrange(0..<byteCount, with: UnsafeBufferPointer(start: outputPointer, count: byteCount))
        }

        private func metalStrength(for preset: SpektraGrainPreset) -> Float {
            switch preset.agxParticleAreaUm2 {
            case ..<1.0:
                return 0.022
            case ..<4.0:
                return 0.052
            case ..<7.0:
                return 0.082
            case ..<9.0:
                return 0.112
            default:
                return 0.145
            }
        }

        private func applySpektrafilmGrainConstants(to params: inout Params, profile: SpektraProfile, preset: SpektraGrainPreset, width: Int, height: Int) {
            let pixelSizeUm = Float(35_000.0) / Float(max(width, height))
            let pixelAreaUm2 = pixelSizeUm * pixelSizeUm
            params.pixelSizeUm = pixelSizeUm
            params.densityMin0 = preset.densityMin[0]
            params.densityMin1 = preset.densityMin[1]
            params.densityMin2 = preset.densityMin[2]
            params.uniformity0 = preset.uniformity[0]
            params.uniformity1 = preset.uniformity[1]
            params.uniformity2 = preset.uniformity[2]
            params.finalBlur = preset.blur
            params.dyeCloudBlur = preset.blurDyeCloudsUm
            params.microAmount = preset.microStructure[0]
            params.microSigma = preset.microStructure[1]

            var densityMaxTotal = [Float](repeating: 0, count: 3)
            for channel in 0..<3 {
                for layer in 0..<3 {
                    densityMaxTotal[channel] += profile.densityMaxLayers[layer][channel]
                }
            }

            var dmax = [Float](repeating: 1, count: 9)
            var npp = [Float](repeating: 64, count: 9)
            for layer in 0..<3 {
                for channel in 0..<3 {
                    let index = layer * 3 + channel
                    let fraction = profile.densityMaxLayers[layer][channel] / max(densityMaxTotal[channel], 1e-10)
                    let densityMinLayer = fraction * preset.densityMin[channel]
                    dmax[index] = max(profile.densityMaxLayers[layer][channel] + densityMinLayer, 1e-6)
                    let particleAreaLayer = max(preset.agxParticleAreaUm2 * preset.agxParticleScale[channel] * preset.agxParticleScaleLayers[layer], 1e-6)
                    npp[index] = max((pixelAreaUm2 * fraction) / particleAreaLayer, 1.0)
                }
            }
            params.dmax00 = dmax[0]; params.dmax01 = dmax[1]; params.dmax02 = dmax[2]
            params.dmax10 = dmax[3]; params.dmax11 = dmax[4]; params.dmax12 = dmax[5]
            params.dmax20 = dmax[6]; params.dmax21 = dmax[7]; params.dmax22 = dmax[8]
            params.npp00 = npp[0]; params.npp01 = npp[1]; params.npp02 = npp[2]
            params.npp10 = npp[3]; params.npp11 = npp[4]; params.npp12 = npp[5]
            params.npp20 = npp[6]; params.npp21 = npp[7]; params.npp22 = npp[8]
        }

        private static let shaderSource = """
        #include <metal_stdlib>
        using namespace metal;

        struct SpektraMetalParams {
            uint width;
            uint height;
            float strength;
            float roughness;
            float glarePercent;
            float glareRoughness;
            float glareBlur;
            uint mode;
            uint seed;
            float pixelSizeUm;
            float densityMin0;
            float densityMin1;
            float densityMin2;
            float uniformity0;
            float uniformity1;
            float uniformity2;
            float finalBlur;
            float dyeCloudBlur;
            float microAmount;
            float microSigma;
            float dmax00;
            float dmax01;
            float dmax02;
            float dmax10;
            float dmax11;
            float dmax12;
            float dmax20;
            float dmax21;
            float dmax22;
            float npp00;
            float npp01;
            float npp02;
            float npp10;
            float npp11;
            float npp12;
            float npp20;
            float npp21;
            float npp22;
        };

        static inline float hash_float(uint x) {
            x ^= x >> 16;
            x *= 0x7feb352du;
            x ^= x >> 15;
            x *= 0x846ca68bu;
            x ^= x >> 16;
            return float(x & 0x00ffffffu) / 16777215.0;
        }

        static inline float noise_at(uint2 p, uint seed) {
            uint h = p.x * 1973u + p.y * 9277u + seed * 26699u;
            return hash_float(h);
        }

        static inline float srgb_to_linear(float value) {
            return value <= 0.04045 ? value / 12.92 : pow((value + 0.055) / 1.055, 2.4);
        }

        static inline float linear_to_srgb(float value) {
            value = clamp(value, 0.0, 1.0);
            return value <= 0.0031308 ? value * 12.92 : 1.055 * pow(value, 1.0 / 2.4) - 0.055;
        }

        static inline float layer_dmax(uint layer, uint channel, constant SpektraMetalParams& params) {
            if (layer == 0u && channel == 0u) return params.dmax00;
            if (layer == 0u && channel == 1u) return params.dmax01;
            if (layer == 0u && channel == 2u) return params.dmax02;
            if (layer == 1u && channel == 0u) return params.dmax10;
            if (layer == 1u && channel == 1u) return params.dmax11;
            if (layer == 1u && channel == 2u) return params.dmax12;
            if (layer == 2u && channel == 0u) return params.dmax20;
            if (layer == 2u && channel == 1u) return params.dmax21;
            return params.dmax22;
        }

        static inline float layer_npp(uint layer, uint channel, constant SpektraMetalParams& params) {
            if (layer == 0u && channel == 0u) return params.npp00;
            if (layer == 0u && channel == 1u) return params.npp01;
            if (layer == 0u && channel == 2u) return params.npp02;
            if (layer == 1u && channel == 0u) return params.npp10;
            if (layer == 1u && channel == 1u) return params.npp11;
            if (layer == 1u && channel == 2u) return params.npp12;
            if (layer == 2u && channel == 0u) return params.npp20;
            if (layer == 2u && channel == 1u) return params.npp21;
            return params.npp22;
        }

        static inline float channel_density_min(uint channel, constant SpektraMetalParams& params) {
            if (channel == 0u) return params.densityMin0;
            if (channel == 1u) return params.densityMin1;
            return params.densityMin2;
        }

        static inline float channel_uniformity(uint channel, constant SpektraMetalParams& params) {
            if (channel == 0u) return params.uniformity0;
            if (channel == 1u) return params.uniformity1;
            return params.uniformity2;
        }

        static inline float spektra_layer_particle(float density, uint2 gid, uint layer, uint channel, constant SpektraMetalParams& params) {
            float densityMax = max(layer_dmax(layer, channel, params), 1e-6);
            float npp = max(layer_npp(layer, channel, params), 1.0);
            float uniformity = clamp(channel_uniformity(channel, params), 0.0, 0.999999);
            float probability = clamp(density / densityMax, 1e-6, 1.0 - 1e-6);
            float saturation = 1.0 - probability * uniformity * (1.0 - 1e-6);
            float odParticle = densityMax / npp;

            float lambda = npp / max(saturation, 1e-6);
            float seedNoise = noise_at(gid + uint2(layer * 41u + channel * 17u, layer * 13u + channel * 29u), params.seed + layer * 101u + channel * 313u);
            float seedCount = max(1.0, lambda + (seedNoise - 0.5) * 2.0 * sqrt(max(lambda, 1.0)));
            float developedNoise = noise_at(gid + uint2(layer * 7u + channel * 53u, layer * 31u + channel * 11u), params.seed + layer * 433u + channel * 911u);
            float developed = seedCount * probability + (developedNoise - 0.5) * 2.0 * sqrt(max(seedCount * probability * (1.0 - probability), 0.0));
            return max(0.0, developed) * odParticle * saturation;
        }

        static inline float3 read_rgb(const device uchar4 *pixels, uint x, uint y, constant SpektraMetalParams& params) {
            x = min(x, params.width - 1u);
            y = min(y, params.height - 1u);
            uchar4 px = pixels[y * params.width + x];
            return float3(px.x, px.y, px.z) / 255.0;
        }

        kernel void spektra_grain_glare(
            const device uchar4 *input [[buffer(0)]],
            device uchar4 *output [[buffer(1)]],
            constant SpektraMetalParams& params [[buffer(2)]],
            uint2 gid [[thread_position_in_grid]]
        ) {
            if (gid.x >= params.width || gid.y >= params.height) {
                return;
            }

            const uint index = gid.y * params.width + gid.x;
            uchar4 src = input[index];
            float3 rgb = float3(src.x, src.y, src.z) / 255.0;
            float3 linearRgb = float3(srgb_to_linear(rgb.r), srgb_to_linear(rgb.g), srgb_to_linear(rgb.b));
            float3 originalDensity = -log10(max(linearRgb, float3(1e-6)));
            float3 grainedDensity = float3(0.0);

            for (uint channel = 0u; channel < 3u; channel++) {
                float density = channel == 0u ? originalDensity.r : (channel == 1u ? originalDensity.g : originalDensity.b);
                float channelMax = layer_dmax(0u, channel, params) + layer_dmax(1u, channel, params) + layer_dmax(2u, channel, params);
                float channelMin = channel_density_min(channel, params);
                float densityWithMin = density + channelMin;
                float channelOut = 0.0;
                for (uint layer = 0u; layer < 3u; layer++) {
                    float layerFraction = layer_dmax(layer, channel, params) / max(channelMax, 1e-6);
                    float layerDensity = densityWithMin * layerFraction;
                    uint dyeStep = max(uint(1), uint(round(fmax(params.dyeCloudBlur, 0.0))));
                    float dyeNoise = noise_at(gid / dyeStep + uint2(layer * 19u, channel * 23u), params.seed + 700u + layer * 37u + channel * 71u);
                    layerDensity *= 0.92 + dyeNoise * 0.16;
                    channelOut += spektra_layer_particle(layerDensity, gid, layer, channel, params);
                }
                uint microStep = max(uint(1), uint(round(fmax(params.microAmount / fmax(params.pixelSizeUm, 1e-6), 0.0))));
                float microNoise = noise_at(gid / microStep + uint2(channel * 61u, 97u), params.seed + 1700u + channel * 101u);
                float microSigma = params.microSigma * 0.001 / fmax(params.pixelSizeUm, 1e-6);
                channelOut *= max(0.0, 1.0 + (microNoise - 0.5) * microSigma * 2.0);
                channelOut -= channelMin;
                if (channel == 0u) grainedDensity.r = channelOut;
                else if (channel == 1u) grainedDensity.g = channelOut;
                else grainedDensity.b = channelOut;
            }

            float3 deltaDensity = grainedDensity - originalDensity;
            float neutralDelta = dot(deltaDensity, float3(0.2126, 0.7152, 0.0722));
            float3 gain = params.mode == 1u ? pow(float3(10.0), -deltaDensity) : float3(pow(10.0, -neutralDelta));
            rgb = float3(linear_to_srgb(linearRgb.r * gain.r), linear_to_srgb(linearRgb.g * gain.g), linear_to_srgb(linearRgb.b * gain.b));

            float3 glare = float3(0.0);
            float total = 0.0;
            int radius = max(1, int(round(params.glareBlur * 6.0)));
            for (int yy = -radius; yy <= radius; yy++) {
                for (int xx = -radius; xx <= radius; xx++) {
                    float dist = length(float2(xx, yy));
                    float weight = exp(-(dist * dist) / max(0.001, 2.0 * radius * radius));
                    uint sx = uint(clamp(int(gid.x) + xx, 0, int(params.width) - 1));
                    uint sy = uint(clamp(int(gid.y) + yy, 0, int(params.height) - 1));
                    float3 sampleRgb = read_rgb(input, sx, sy, params);
                    float sampleLum = dot(sampleRgb, float3(0.2126, 0.7152, 0.0722));
                    float hot = smoothstep(0.70, 1.0, sampleLum);
                    glare += sampleRgb * hot * weight;
                    total += weight;
                }
            }
            glare /= max(total, 0.001);
            float glareNoise = mix(1.0, 0.65 + noise_at(gid / 3u + uint2(71u, 13u), params.seed + 173u) * 0.7, clamp(params.glareRoughness, 0.0, 1.0));
            rgb += glare * params.glarePercent * glareNoise;

            rgb = clamp(rgb, 0.0, 1.0);
            output[index] = uchar4(uchar(round(rgb.r * 255.0)), uchar(round(rgb.g * 255.0)), uchar(round(rgb.b * 255.0)), src.a);
        }
        """
    }

    private enum NativeCameraError: LocalizedError {
        case cameraUnavailable
        case invalidSession
        case invalidImage
        case invalidLut
        case spektra(String)

        var errorDescription: String? {
            switch self {
            case .cameraUnavailable:
                return "Requested camera is unavailable"
            case .invalidSession:
                return "Unable to configure native camera session"
            case .invalidImage:
                return "Unable to process native image"
            case .invalidLut:
                return "Native LUT data is invalid"
            case .spektra(let message):
                return "Spektra failed: \(message)"
            }
        }
    }
}

extension KonoNativeBridgePlugin: AVCapturePhotoCaptureDelegate {
    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        if let error {
            DispatchQueue.main.async {
                self.pendingCaptureCall?.reject(error.localizedDescription)
                self.pendingStackCapture?.call.reject(error.localizedDescription)
                self.pendingCaptureCall = nil
                self.pendingStackCapture = nil
            }
            return
        }

        guard let data = photo.fileDataRepresentation() else {
            DispatchQueue.main.async {
                self.pendingCaptureCall?.reject("Native camera did not return JPEG data")
                self.pendingStackCapture?.call.reject("Native camera did not return JPEG data")
                self.pendingCaptureCall = nil
                self.pendingStackCapture = nil
            }
            return
        }

        if let request = pendingStackCapture {
            pendingStackCapture = nil
            stackCaptureProcessing = true
            let captureMs = elapsedMs(since: request.startedAt)
            cameraQueue.async {
                do {
                    let outputSize = self.orientedOutputSize(
                        width: request.width,
                        height: request.height,
                        orientation: request.captureOrientation
                    )
                    let normalizeStart = CACurrentMediaTime()
                    let normalizedData = try self.normalizedCaptureData(
                        from: data,
                        width: request.width,
                        height: request.height,
                        cropFactor: request.cropFactor,
                        mirrored: request.mirrored,
                        orientation: request.captureOrientation
                    )
                    let normalizeMs = self.elapsedMs(since: normalizeStart)
                    self.emitSpektraPendingPreviewIfNeeded(
                        request: request,
                        normalizedData: normalizedData,
                        outputSize: outputSize
                    )
                    let coreImageStart = CACurrentMediaTime()
                    let lutData = try self.processPhotoData(
                        normalizedData,
                        lutData: request.lutData,
                        intensity: request.intensity,
                        effects: request.effects
                    )
                    let coreImageMs = self.elapsedMs(since: coreImageStart)
                    let overlayStart = CACurrentMediaTime()
                    let stackedData = try self.renderNativeStack(
                        photoData: lutData,
                        width: outputSize.width,
                        height: outputSize.height,
                        filter: request.filter,
                        effects: request.effects,
                        importedEffects: request.importedEffects,
                        overlaySelections: request.overlaySelections
                    )
                    let overlayMs = self.elapsedMs(since: overlayStart)
                    let spektraStart = CACurrentMediaTime()
                    let spektraResult = try self.applySpektraGrainIfNeeded(stackedData, importedEffects: request.importedEffects)
                    let renderedData = spektraResult.data
                    let spektraMs = self.elapsedMs(since: spektraStart)
                    let galleryWriteStart = CACurrentMediaTime()
                    let galleryItem = try self.writeNativeGalleryItem(
                        data: renderedData,
                        filename: request.filename,
                        cameraName: request.cameraName,
                        orientation: self.orientationName(request.captureOrientation),
                        originalData: normalizedData
                    )
                    let galleryWriteMs = self.elapsedMs(since: galleryWriteStart)
                    let photosStart = CACurrentMediaTime()
                    self.savePhotoData(renderedData) { success, _ in
                        let metrics: JSObject = [
                            "captureMs": captureMs,
                            "normalizeMs": normalizeMs,
                            "coreImageMs": coreImageMs,
                            "overlayMs": overlayMs,
                            "spektraMs": spektraMs,
                            "galleryWriteMs": galleryWriteMs,
                            "photosSaveMs": self.elapsedMs(since: photosStart),
                            "totalMs": self.elapsedMs(since: request.startedAt),
                            "inputBytes": data.count,
                            "normalizedBytes": normalizedData.count,
                            "jpegBytes": renderedData.count,
                            "spektraApplied": spektraResult.applied,
                            "spektraPreset": spektraResult.preset,
                            "spektraMode": spektraResult.applied ? spektraResult.mode : "",
                            "spektraBackend": spektraResult.backend,
                            "spektraFullPipelineApplied": spektraResult.fullPipelineApplied,
                            "spektraFullPipeline": spektraResult.fullPipelineApplied ? "kodak_gold_200_to_kodak_portra_endura_32_lut" : "",
                            "spektraGlare": spektraResult.applied ? [
                                "active": true,
                                "percent": 0.25,
                                "roughness": 0.70,
                                "blur": 0.50
                            ] : NSNull(),
                            "spektraError": spektraResult.error ?? NSNull(),
                            "orientationSource": request.captureOrientationSource,
                            "deviceOrientation": request.captureDeviceOrientation,
                            "gravityX": request.captureGravityX ?? NSNull(),
                            "gravityY": request.captureGravityY ?? NSNull(),
                            "gravityZ": request.captureGravityZ ?? NSNull()
                        ]
                        DispatchQueue.main.async {
                            request.call.resolve([
                                "item": galleryItem,
                                "filename": request.filename,
                                "saved": success,
                                "width": outputSize.width,
                                "height": outputSize.height,
                                "orientation": self.orientationName(request.captureOrientation),
                                "metrics": metrics
                            ])
                        }
                        self.cameraQueue.async {
                            self.stackCaptureProcessing = false
                        }
                    }
                } catch {
                    self.stackCaptureProcessing = false
                    DispatchQueue.main.async {
                        request.call.reject(error.localizedDescription)
                    }
                }
            }
            return
        }

        let orientedData = normalizedJpegData(from: data)
        let dataUrl = "data:image/jpeg;base64,\(orientedData.base64EncodedString())"
        DispatchQueue.main.async {
            self.pendingCaptureCall?.resolve([
                "dataUrl": dataUrl,
                "filename": "native-capture-\(Int(Date().timeIntervalSince1970 * 1000)).jpg",
                "mirrored": self.pendingCaptureMirrored,
                "orientation": self.orientationName(self.pendingCaptureOrientation)
            ])
            self.pendingCaptureCall = nil
        }
    }
}
