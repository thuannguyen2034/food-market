'use client';

import Link from 'next/link';
import { 
  Facebook, 
  Instagram, 
  Youtube, 
  MapPin, 
  Phone, 
  Mail, 
  Send,
  CreditCard,
  Truck,
  ShieldCheck
} from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footerWrapper}>
      <div className={styles.mainFooter}>
        <div className={styles.container}>
          <div className={styles.gridRow}>
            
            <div className={styles.col}>
              <Link href="/" className={styles.logoLink}>
                 <span className={styles.logoText}>BonMi<span className={styles.highlight}>Market</span></span>
              </Link>
              <p className={styles.desc}>
                Hệ thống thực phẩm sạch & Công thức chuẩn vị BonMi. 
                Chúng tôi cam kết mang đến những bữa ăn ngon, an toàn cho gia đình bạn.
              </p>
              <ul className={styles.contactList}>
                <li>
                  <MapPin size={18} className={styles.icon} />
                  <span>Số 1, Đại Cồ Việt, Hai Bà Trưng, Hà Nội</span>
                </li>
                <li>
                  <Phone size={18} className={styles.icon} />
                  <a href="tel:0853539203">0853.539.203</a>
                </li>
                <li>
                  <Mail size={18} className={styles.icon} />
                  <a href="mailto:cskh@bonmi.vn">cskh@bonmi.vn</a>
                </li>
              </ul>
            </div>

            <div className={styles.col}>
              <h4>Hỗ trợ khách hàng</h4>
              <ul className={styles.linksList}>
                <li><Link href="/faq">Câu hỏi thường gặp</Link></li>
                <li><Link href="/shipping-policy">Chính sách vận chuyển</Link></li>
                <li><Link href="/return-policy">Chính sách đổi trả</Link></li>
                <li><Link href="/payment-guide">Hướng dẫn thanh toán</Link></li>
                <li><Link href="/contact">Liên hệ</Link></li>
              </ul>
            </div>

            <div className={styles.col}>
              <h4>Về BonMi</h4>
              <ul className={styles.linksList}>
                <li><Link href="/about">Giới thiệu</Link></li>
                <li><Link href="/stores">Hệ thống cửa hàng</Link></li>
                <li><Link href="/careers">Tuyển dụng</Link></li>
                <li><Link href="/terms">Điều khoản sử dụng</Link></li>
                <li><Link href="/privacy">Chính sách bảo mật</Link></li>
              </ul>
            </div>

            <div className={styles.col}>
              <h4>Kết nối với chúng tôi</h4>
              <div className={styles.socials}>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className={styles.socialBtn}><Facebook size={20} /></a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className={styles.socialBtn}><Instagram size={20} /></a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className={styles.socialBtn}><Youtube size={20} /></a>
              </div>
              
              <h4 style={{ marginTop: '20px' }}>Phương thức thanh toán</h4>
              <div className={styles.payments}>
                <div className={styles.payIcon} title="Tiền mặt"><Truck size={20} /></div>
                <div className={styles.payIcon} title="Thẻ ngân hàng"><CreditCard size={20} /></div>
                <div className={styles.payIcon} title="Bảo mật"><ShieldCheck size={20} /></div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <div className={styles.container}>
          <div className={styles.bottomContent}>
            <p>&copy; {currentYear} BonMi Market. All rights reserved.</p>
            <p className={styles.designer}>Designed for Graduation Project</p>
          </div>
        </div>
      </div>
    </footer>
  );
}