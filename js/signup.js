// ─────────────────────────────────────────────────────────────
// js/signup.js — หน้าสมัครสมาชิก
// สัปดาห์ที่ 7: สมัครด้วยอีเมล/รหัสผ่านผ่าน Firebase Authentication
// สมัครสำเร็จแล้วสร้างไฟล์ใหม่ในโฟลเดอร์ users โดย role เริ่มต้นเป็น employee เสมอ
// ─────────────────────────────────────────────────────────────
import { auth, db } from "./firebase-init.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มสมัครสมาชิก");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มสมัครสมาชิก = document.getElementById("ปุ่มสมัครสมาชิก");

  ฟอร์ม.addEventListener("submit", async function (e) {
    e.preventDefault();

    var ชื่อ = document.getElementById("name").value.trim();
    var อีเมล = document.getElementById("email").value.trim();
    var รหัสผ่าน = document.getElementById("password").value;
    var ยืนยันรหัสผ่าน = document.getElementById("confirmPassword").value;

    if (!ชื่อ || !อีเมล || !รหัสผ่าน || !ยืนยันรหัสผ่าน) {
      เตือน("กรอกให้ครบทุกช่องก่อน จึงจะสมัครสมาชิกได้");
      return;
    }
    if (รหัสผ่าน !== ยืนยันรหัสผ่าน) {
      เตือน("รหัสผ่านสองช่องไม่ตรงกัน");
      return;
    }

    ปุ่มสมัครสมาชิก.disabled = true;
    try {
      var ข้อมูลรับรอง = await createUserWithEmailAndPassword(auth, อีเมล, รหัสผ่าน);
      await setDoc(doc(db, "users", ข้อมูลรับรอง.user.uid), {
        name: ชื่อ,
        email: อีเมล,
        role: "employee"   // สมัครใหม่เริ่มที่ employee เสมอ เปลี่ยนเองจากฟอร์มไม่ได้
      });
      location.href = "leave-requests.html";
    } catch (err) {
      เตือน(ข้อความจากรหัสผิดพลาด(err.code));
      ปุ่มสมัครสมาชิก.disabled = false;
    }
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }

  function ข้อความจากรหัสผิดพลาด(รหัส) {
    if (รหัส === "auth/email-already-in-use") {
      return "อีเมลนี้สมัครสมาชิกไว้แล้ว ลองเข้าสู่ระบบแทน";
    }
    if (รหัส === "auth/invalid-email") {
      return "รูปแบบอีเมลไม่ถูกต้อง";
    }
    if (รหัส === "auth/weak-password") {
      return "รหัสผ่านสั้นเกินไป ต้องมีอย่างน้อย 6 ตัวอักษร";
    }
    return "สมัครสมาชิกไม่สำเร็จ: " + รหัส;
  }
})();
