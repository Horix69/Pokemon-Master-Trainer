"""Build the offline APK with JDK 17 and Android SDK Build Tools 35."""
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
java = Path(os.environ["JAVA_HOME"]) / "bin"
tools = Path(os.environ["ANDROID_BUILD_TOOLS"])
platform = Path(os.environ["ANDROID_JAR"])
key = Path(os.environ["ANDROID_KEYSTORE"]).resolve()
target = Path(sys.argv[1]).resolve()
def run(*args):
    subprocess.run([str(a) for a in args], check=True)

with tempfile.TemporaryDirectory() as tmp:
    d = Path(tmp)
    shutil.copytree(root / "android/res", d / "res")
    shutil.copy(root / "android/AndroidManifest.xml", d)
    shutil.copy(root / "android/GameActivity.java", d)
    run(tools / "aapt2.exe", "compile", "--dir", d / "res", "-o", d / "res.zip")
    run(tools / "aapt2.exe", "link", "-I", platform, "--manifest", d / "AndroidManifest.xml", "-o", d / "base.apk", d / "res.zip")
    classes = d / "classes"
    classes.mkdir()
    if "ECJ_JAR" in os.environ:
        run(java/"java.exe","-jar",os.environ["ECJ_JAR"],"-1.8","-classpath",platform,"-d",classes,d/"GameActivity.java")
    else:
        run(java/"javac.exe","--release","8","-classpath",platform,"-d",classes,d/"GameActivity.java")
    run(java / "jar.exe", "cf", d / "classes.jar", "-C", classes, ".")
    run(java / "java.exe", "-cp", tools / "lib/d8.jar", "com.android.tools.r8.D8", "--min-api", "28", "--lib", platform, "--output", d, d / "classes.jar")
    with zipfile.ZipFile(d / "base.apk","a") as z:
        z.write(d / "classes.dex", "classes.dex")
        files = [root / n for n in ("index.html","ui/game.js","ui/style.css","ui/tabletop.css","ui/expedition.css","ui/welcome.js","ui/touch.js")]
        files += sorted((root / "assets").rglob("*"))
        for f in files:
            if f.is_file():
                z.write(f, "assets/" + f.relative_to(root).as_posix(), zipfile.ZIP_STORED if f.suffix in (".mp3",".webp",".png") else zipfile.ZIP_DEFLATED)
    run(tools / "zipalign.exe","-f","4",d/"base.apk",d/"aligned.apk")
    signer = [java / "java.exe", "-jar", tools / "lib/apksigner.jar"]
    run(*signer,"sign","--ks",key,"--ks-pass","env:APK_PASSWORD","--v4-signing-enabled","false","--out",d/"game.apk",d/"aligned.apk")
    run(*signer,"verify","--verbose",d/"game.apk")
    run(tools/"zipalign.exe","-c","4",d/"game.apk")
    shutil.copyfile(d/"game.apk",target)



