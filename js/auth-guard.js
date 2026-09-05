// ─────────────────────────────────────────────────────────────
// js/auth-guard.js — เช็กว่าล็อกอินอยู่ไหมก่อนใช้หน้าที่ต้องล็อกอิน
// หน้าที่ต้องล็อกอินก่อน ให้ import { requireLogin } มาเรียกเป็นบรรทัดแรก
// ─────────────────────────────────────────────────────────────
import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export function requireLogin() {
  return new Promise(function (resolve) {
    onAuthStateChanged(auth, async function (user) {
      if (!user) {
        location.href = "login.html";
        return;
      }

      var เอกสารผู้ใช้ = await getDoc(doc(db, "users", user.uid));
      var ข้อมูลผู้ใช้ = เอกสารผู้ใช้.exists()
        ? เอกสารผู้ใช้.data()
        : { name: user.email, email: user.email, role: "employee" };

      แสดงผู้ใช้ในnavbar(ข้อมูลผู้ใช้.name);
      ซ่อนเมนูตามrole(ข้อมูลผู้ใช้.role);
      resolve(Object.assign({ uid: user.uid }, ข้อมูลผู้ใช้));
    });
  });
}

// เติมชื่อผู้ใช้ + ปุ่มออกจากระบบ ลงในช่อง #navUser ที่ nav.js เตรียมไว้ให้
function แสดงผู้ใช้ในnavbar(ชื่อ) {
  var ที่วาง = document.getElementById("navUser");
  if (!ที่วาง) return;
  ที่วาง.innerHTML = esc(ชื่อ) + ' <button type="button" class="btn btn-ghost" id="ปุ่มออกจากระบบ">ออกจากระบบ</button>';
  document.getElementById("ปุ่มออกจากระบบ").addEventListener("click", async function () {
    await signOut(auth);
    location.href = "login.html";
  });
}

// ตาม ACL.md — จัดการประเภทการลาเป็นสิทธิ์ของฝ่ายบุคคล (hr) เท่านั้น
function ซ่อนเมนูตามrole(role) {
  if (role === "hr") return;
  var ลิงก์ประเภทการลา = document.querySelector('#nav a[href="leave-types.html"]');
  if (ลิงก์ประเภทการลา) ลิงก์ประเภทการลา.remove();
}
