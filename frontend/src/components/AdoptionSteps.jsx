const steps = [
  {
    title: 'เลือกน้องที่ถูกใจ',
    description: 'กรองตามสายพันธุ์ ขนาด และพื้นที่',
  },
  {
    title: 'ยื่นคำขอรับเลี้ยง',
    description: 'กรอกข้อมูลและเหตุผลสั้น ๆ',
  },
  {
    title: 'เจ้าหน้าที่พิจารณา',
    description: 'ตรวจสอบความพร้อมและติดต่อกลับ',
  },
  {
    title: 'นัดรับน้องกลับบ้าน',
    description: 'นัดวันรับและติดตามผลหลังรับเลี้ยง',
  },
]

export default function AdoptionSteps() {
  return (
    <section className="adoption-steps" aria-labelledby="adoption-steps-title">
      <header className="adoption-steps__heading">
        <h2 id="adoption-steps-title">ขั้นตอนการรับเลี้ยง</h2>
        <p>ง่าย ๆ ใน 4 ขั้นตอน</p>
      </header>
      <div className="adoption-steps__grid">
        {steps.map((step, index) => (
          <article className="adoption-step" key={step.title}>
            <span className="adoption-step__number" aria-label={`ขั้นตอนที่ ${index + 1}`}>
              {index + 1}
            </span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
