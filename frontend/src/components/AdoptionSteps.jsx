import { Heart, Home, PawPrint, Search, ShieldCheck } from 'lucide-react'
import useReveal from '../hooks/useReveal'

const steps = [
  {
    title: 'เลือกน้องที่ถูกใจ',
    description: 'กรองตามสายพันธุ์ ขนาด และพื้นที่',
    icon: Search,
  },
  {
    title: 'ยื่นคำขอรับเลี้ยง',
    description: 'กรอกข้อมูลและเหตุผลสั้น ๆ',
    icon: Heart,
  },
  {
    title: 'เจ้าหน้าที่พิจารณา',
    description: 'ตรวจสอบความพร้อมและติดต่อกลับ',
    icon: ShieldCheck,
  },
  {
    title: 'นัดรับน้องกลับบ้าน',
    description: 'นัดวันรับและติดตามผลหลังรับเลี้ยง',
    icon: Home,
  },
]

export default function AdoptionSteps() {
  const reveal = useReveal()

  return (
    <section
      className={`adoption-steps reveal${reveal.isRevealed ? ' is-revealed' : ''}`}
      ref={reveal.ref}
      aria-labelledby="adoption-steps-title"
    >
      <header className="adoption-steps__heading">
        <h2 id="adoption-steps-title">ขั้นตอนการรับเลี้ยง</h2>
        <p>ง่าย ๆ ใน 4 ขั้นตอน</p>
      </header>
      <div className="adoption-steps__grid">
        {steps.map((step, index) => (
          <article className="adoption-step" key={step.title}>
            <span className="adoption-step__number" aria-label={`ขั้นตอนที่ ${index + 1}`}>
              {index === 0 ? <PawPrint size={20} aria-hidden="true" /> : index + 1}
            </span>
            <step.icon className="adoption-step__icon" size={23} aria-hidden="true" />
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
