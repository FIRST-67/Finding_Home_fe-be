import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <section className="site-footer__brand" aria-label="เกี่ยวกับ Finding Home">
          <Link className="site-footer__name" to="/">Finding Home</Link>
          <p>เชื่อมน้องหมากับครอบครัวที่ใช่</p>
        </section>

        <section className="site-footer__contact" aria-labelledby="footer-contact-title">
          <h2 id="footer-contact-title">ช่องทางติดต่อ</h2>
          <p>สอบถามเรื่องการรับเลี้ยงได้จากหน้าค้นหาน้องหมาและรายละเอียดแต่ละตัว</p>
          <Link to="/explore">ค้นหาน้องหมา <span aria-hidden="true">→</span></Link>
        </section>

        <nav className="site-footer__links" aria-label="ลิงก์เพิ่มเติม">
          <a href="/about">เกี่ยวกับเรา</a>
          <a href="/privacy">นโยบายความเป็นส่วนตัว</a>
          <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">Facebook</a>
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
        </nav>
      </div>
    </footer>
  )
}
