// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ
// สัปดาห์ที่ 7: ล็อกอินด้วยอีเมล/รหัสผ่านผ่าน Firebase Authentication
// ─────────────────────────────────────────────────────────────
import { auth } from "./firebase-init.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มล็อกอิน");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มเข้าสู่ระบบ = document.getElementById("ปุ่มเข้าสู่ระบบ");

  ฟอร์ม.addEventListener("submit", async function (e) {
    e.preventDefault();

    var อีเมล = document.getElementById("email").value.trim();
    var รหัสผ่าน = document.getElementById("password").value;

    if (!อีเมล || !รหัสผ่าน) {
      เตือน("กรอกอีเมลและรหัสผ่านให้ครบก่อน");
      return;
    }

    ปุ่มเข้าสู่ระบบ.disabled = true;
    try {
      await signInWithEmailAndPassword(auth, อีเมล, รหัสผ่าน);
      location.href = "leave-requests.html";
    } catch (err) {
      เตือน(ข้อความจากรหัสผิดพลาด(err.code));
      ปุ่มเข้าสู่ระบบ.disabled = false;
    }
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }

  function ข้อความจากรหัสผิดพลาด(รหัส) {
    if (รหัส === "auth/invalid-credential" || รหัส === "auth/user-not-found" || รหัส === "auth/wrong-password") {
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    }
    if (รหัส === "auth/invalid-email") {
      return "รูปแบบอีเมลไม่ถูกต้อง";
    }
    if (รหัส === "auth/too-many-requests") {
      return "ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่";
    }
    return "เข้าสู่ระบบไม่สำเร็จ: " + รหัส;
  }
})();
