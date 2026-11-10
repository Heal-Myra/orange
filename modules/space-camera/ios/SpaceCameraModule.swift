// Spaces on the phone (founder, 10 Nov 2026; decisions 0055, 0056). Two jobs, both done on the iPhone itself:
// 1. framesAsync: a few still pictures from a walk-round video (the video never leaves the phone).
// 2. blurFacesAsync: finds faces with Apple's on-phone Vision and blurs them before a photo is sent to Myra.
// Every picture written here is a fresh JPEG with no location, phone or time notes in it.

import AVFoundation
import CoreImage
import ExpoModulesCore
import UIKit
import Vision

struct SpaceFrame: Record {
  @Field var uri: String = ""
  @Field var width: Int = 0
  @Field var height: Int = 0
}

struct SpaceBlurred: Record {
  @Field var uri: String = ""
  @Field var faces: Int = 0
  @Field var width: Int = 0
  @Field var height: Int = 0
}

private func fileURL(_ uri: String) -> URL? {
  if uri.hasPrefix("file://") { return URL(string: uri) }
  if uri.hasPrefix("/") { return URL(fileURLWithPath: uri) }
  return nil
}

private func writeJpeg(_ image: UIImage, quality: CGFloat) -> URL? {
  guard let data = image.jpegData(compressionQuality: quality) else { return nil }
  let file = FileManager.default.temporaryDirectory.appendingPathComponent("space-\(UUID().uuidString).jpg")
  do { try data.write(to: file) } catch { return nil }
  return file
}

public class SpaceCameraModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SpaceCamera")

    AsyncFunction("framesAsync") { (uri: String, count: Int, maxSize: Double) -> [SpaceFrame] in
      guard let url = fileURL(uri) else { return [] }
      let asset = AVURLAsset(url: url)
      let seconds = CMTimeGetSeconds(asset.duration)
      if !seconds.isFinite || seconds <= 0 { return [] }
      let gen = AVAssetImageGenerator(asset: asset)
      gen.appliesPreferredTrackTransform = true
      gen.maximumSize = CGSize(width: maxSize, height: maxSize)
      let tolerance = CMTime(seconds: 0.4, preferredTimescale: 600)
      gen.requestedTimeToleranceBefore = tolerance
      gen.requestedTimeToleranceAfter = tolerance
      let n = max(1, min(count, 8))
      var out: [SpaceFrame] = []
      for i in 0..<n {
        let t = seconds * (Double(i) + 0.5) / Double(n)
        guard let cg = try? gen.copyCGImage(at: CMTime(seconds: t, preferredTimescale: 600), actualTime: nil) else { continue }
        guard let file = writeJpeg(UIImage(cgImage: cg), quality: 0.8) else { continue }
        var frame = SpaceFrame()
        frame.uri = file.absoluteString
        frame.width = cg.width
        frame.height = cg.height
        out.append(frame)
      }
      return out
    }

    AsyncFunction("blurFacesAsync") { (uri: String) -> SpaceBlurred in
      var result = SpaceBlurred()
      result.uri = uri
      guard let url = fileURL(uri), let source = UIImage(contentsOfFile: url.path) else { return result }
      // Draw the picture upright first, so Vision and the blur see the same orientation as a person does.
      let format = UIGraphicsImageRendererFormat()
      format.scale = 1
      let upright = UIGraphicsImageRenderer(size: source.size, format: format).image { _ in
        source.draw(in: CGRect(origin: .zero, size: source.size))
      }
      guard let cg = upright.cgImage else { return result }
      result.width = cg.width
      result.height = cg.height
      let request = VNDetectFaceRectanglesRequest()
      try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([request])
      let faces = request.results ?? []
      result.faces = faces.count
      if faces.isEmpty { return result }

      let image = CIImage(cgImage: cg)
      let w = image.extent.width, h = image.extent.height
      let block = max(w, h) / 40
      let hidden = image.clampedToExtent()
        .applyingFilter("CIPixellate", parameters: [kCIInputScaleKey: block])
        .applyingFilter("CIGaussianBlur", parameters: [kCIInputRadiusKey: block * 0.6])
        .cropped(to: image.extent)
      var output = image
      for face in faces {
        // Vision and Core Image both measure from the bottom-left corner.
        let b = face.boundingBox
        let rect = CGRect(x: b.minX * w, y: b.minY * h, width: b.width * w, height: b.height * h)
          .insetBy(dx: -b.width * w * 0.25, dy: -b.height * h * 0.35)
          .intersection(image.extent)
        output = hidden.cropped(to: rect).composited(over: output)
      }
      guard let outCG = CIContext().createCGImage(output, from: image.extent),
            let file = writeJpeg(UIImage(cgImage: outCG), quality: 0.85) else { return result }
      result.uri = file.absoluteString
      return result
    }
  }
}
