// ─────────────────────────────────────────────────────────────
// js/seed.js — สคริปต์ใช้ครั้งเดียว ใส่ข้อมูลตัวอย่างตามหัวข้อ 7 ของ leaveeasy-spec.md ลง Firestore
// ไม่ผูกกับหน้าไหนของระบบจริง ลบไฟล์นี้กับ seed.html ทิ้งได้หลัง seed เสร็จ
// ─────────────────────────────────────────────────────────────
import { db } from "./firebase-init.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const users = [
  { id: "u001", name: "สมชาย ใจดี", email: "somchai@example.com", role: "employee" },
  { id: "u002", name: "สมหญิง รักงาน", email: "somying@example.com", role: "manager" },
  { id: "u003", name: "สมศรี ตั้งใจ", email: "somsri@example.com", role: "hr" }
];

const leaveTypes = [
  { id: "lt001", name: "ลาพักร้อน" },
  { id: "lt002", name: "ลาป่วย" },
  { id: "lt003", name: "ลากิจ" }
];

const leaveRequests = [
  {
    id: "lr001",
    title: "ลาพักร้อนไปเที่ยวกับครอบครัว",
    reason: "วางแผนเดินทางไปต่างจังหวัดกับครอบครัว จองที่พักไว้ล่วงหน้าแล้ว",
    status: "รอพิจารณา",
    requesterId: "u001", requesterName: "สมชาย ใจดี",
    approverId: "u002", approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
    startDate: "2026-09-07", endDate: "2026-09-09",
    createdAt: "2026-09-01 09:15",
    approvals: [
      { id: "ap001", authorId: "u002", authorName: "สมหญิง รักงาน", message: "รับเรื่องแล้ว ขอดูตารางงานของทีมช่วงนั้นก่อนนะครับ", createdAt: "2026-09-01 13:40" },
      { id: "ap002", authorId: "u003", authorName: "สมศรี ตั้งใจ", message: "ตรวจแล้ว วันลาพักร้อนคงเหลือครอบคลุมช่วงที่ขอ ไม่ติดขัดฝั่งฝ่ายบุคคล", createdAt: "2026-09-02 10:05" }
    ]
  },
  {
    id: "lr002",
    title: "ลาป่วยไข้หวัดใหญ่",
    reason: "มีไข้สูงและไอมาก แพทย์แนะนำให้พักอยู่บ้าน 2 วัน",
    status: "อนุมัติ",
    requesterId: "u001", requesterName: "สมชาย ใจดี",
    approverId: "u002", approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt002", leaveTypeName: "ลาป่วย",
    startDate: "2026-08-24", endDate: "2026-08-25",
    createdAt: "2026-08-24 08:05",
    approvals: [
      { id: "ap003", authorId: "u002", authorName: "สมหญิง รักงาน", message: "อนุมัติแล้ว พักผ่อนให้เต็มที่ งานที่ค้างไว้เดี๋ยวทีมช่วยดูให้", createdAt: "2026-08-24 09:20" }
    ]
  },
  {
    id: "lr003",
    title: "ลากิจไปทำบัตรประชาชน",
    reason: "บัตรประชาชนหมดอายุ ต้องไปทำที่สำนักงานเขตในวันทำการ",
    status: "รอพิจารณา",
    requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
    approverId: "", approverName: "",
    leaveTypeId: "lt003", leaveTypeName: "ลากิจ",
    startDate: "2026-09-15", endDate: "2026-09-15",
    createdAt: "2026-09-10 16:30",
    approvals: []
  },
  {
    id: "lr004",
    title: "ลาพักร้อนช่วงวันหยุดยาว",
    reason: "อยากต่อวันหยุดยาวไปพักผ่อนกับครอบครัวอีก 3 วัน",
    status: "ไม่อนุมัติ",
    requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
    approverId: "u002", approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
    startDate: "2026-10-12", endDate: "2026-10-16",
    createdAt: "2026-09-20 11:00",
    approvals: [
      { id: "ap004", authorId: "u002", authorName: "สมหญิง รักงาน", message: "ช่วงนั้นทีมมีงานส่งมอบพอดี ขอเลื่อนเป็นสัปดาห์ถัดไปได้ไหมครับ", createdAt: "2026-09-20 15:10" }
    ]
  },
  {
    id: "lr005",
    title: "ลาป่วยไปพบแพทย์ตามนัด",
    reason: "มีนัดตรวจติดตามอาการกับแพทย์ในช่วงเช้า",
    status: "รอพิจารณา",
    requesterId: "u001", requesterName: "สมชาย ใจดี",
    approverId: "u002", approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt002", leaveTypeName: "ลาป่วย",
    startDate: "2026-09-22", endDate: "2026-09-22",
    createdAt: "2026-09-18 14:45",
    approvals: []
  }
];

const ปุ่ม = document.getElementById("ปุ่มseed");
const กล่องผล = document.getElementById("ผลลัพธ์seed");

ปุ่ม.addEventListener("click", async function () {
  ปุ่ม.disabled = true;
  บันทึกบรรทัด("กำลังใส่ข้อมูล…");

  try {
    for (const u of users) {
      const { id, ...ข้อมูล } = u;
      await setDoc(doc(db, "users", id), ข้อมูล);
      บันทึกบรรทัด("✅ users/" + id);
    }

    for (const lt of leaveTypes) {
      const { id, ...ข้อมูล } = lt;
      await setDoc(doc(db, "leaveTypes", id), ข้อมูล);
      บันทึกบรรทัด("✅ leaveTypes/" + id);
    }

    for (const lr of leaveRequests) {
      const { id, approvals, ...ข้อมูล } = lr;
      await setDoc(doc(db, "leaveRequests", id), ข้อมูล);
      บันทึกบรรทัด("✅ leaveRequests/" + id);
      for (const ap of approvals) {
        const { id: apId, ...apข้อมูล } = ap;
        await setDoc(doc(db, "leaveRequests", id, "approvals", apId), apข้อมูล);
        บันทึกบรรทัด("　　✅ approvals/" + apId);
      }
    }

    บันทึกบรรทัด("🎉 ใส่ข้อมูลครบแล้ว — เปิด Firebase Console เพื่อตรวจสอบ");
  } catch (err) {
    บันทึกบรรทัด("❌ ผิดพลาด: " + err.message);
    บันทึกบรรทัด("ตรวจว่าเปิด Firestore Database ไว้แล้ว และกฎอนุญาตให้เขียนได้ชั่วคราว");
  } finally {
    ปุ่ม.disabled = false;
  }
});

function บันทึกบรรทัด(ข้อความ) {
  กล่องผล.textContent += ข้อความ + "\n";
}
