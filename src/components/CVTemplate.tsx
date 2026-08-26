import type { ReactNode, RefObject } from 'react';
import { BriefcaseBusiness, CalendarDays, GraduationCap, Info, Mail, MapPin, Phone } from 'lucide-react';
import styles from './CVTemplate.module.css';

type Experience = {
  company: string;
  position: string;
  from: string;
  to: string;
  description: string;
};

type Candidate = {
  name: string;
  phone: string;
  email: string;
  birthYear: string;
  location: string;
  education: string;
  school: string;
  major: string;
  smartphone: string;
  vehicle: string;
  hours: string;
  mobility: string;
  cod: string;
  notes: string;
  experiences: Experience[];
};

type CVTemplateProps = {
  candidate: Candidate;
  photo: string;
  generatedAt: Date;
  pageRef?: RefObject<HTMLDivElement>;
  className?: string;
};

const valueOrDash = (value: string) => value.trim() || '—';

const splitIntoBullets = (value: string) => value
  .split(/\n+|(?<=[.!?])\s+|;\s*/)
  .map((part) => part.trim().replace(/[.!?]+$/, ''))
  .filter(Boolean);

const formatGeneratedAt = (date: Date) => {
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${time} | ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/26`;
};

function DetailLine({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <div className={styles.detailLine}>{icon}<span>{children}</span></div>;
}

function SectionHeading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <h2 className={styles.sectionHeading}>{icon}<span>{children}</span></h2>;
}

function RequirementRow({ label, value }: { label: string; value: string }) {
  return <div className={styles.requirementRow}><span>{label}</span><strong>{valueOrDash(value)}</strong></div>;
}

export default function CVTemplate({ candidate, photo, generatedAt, pageRef, className }: CVTemplateProps) {
  const experiences = candidate.experiences.filter((item) => item.company || item.position || item.from || item.to || item.description);
  const notes = splitIntoBullets(candidate.notes);

  return (
    <div ref={pageRef} className={`${styles.page}${className ? ` ${className}` : ''}`} data-cv-page="true">
      <header className={styles.header}>
        <img className={styles.viettelLogo} src="/assets/images/viettel-post-logo-png_seeklogo-470845 copy.png" alt="Viettel Post" />
      </header>
      <div className={styles.redDivider} />

      <section className={styles.candidateBlock}>
        <div className={styles.portrait}>
          {photo ? <img src={photo} alt="Ảnh ứng viên" /> : <span className={styles.emptyPortrait}>Ảnh</span>}
        </div>
        <div className={styles.candidateDetails}>
          <h1>{valueOrDash(candidate.name)}</h1>
          <h3>ỨNG TUYỂN BƯU TÁ</h3>
          <div className={styles.contactList}>
            <DetailLine icon={<Phone />}>{valueOrDash(candidate.phone)}</DetailLine>
            <DetailLine icon={<Mail />}>{valueOrDash(candidate.email)}</DetailLine>
            <DetailLine icon={<CalendarDays />}>{valueOrDash(candidate.birthYear)}</DetailLine>
            <DetailLine icon={<MapPin />}>{valueOrDash(candidate.location)}</DetailLine>
          </div>
        </div>
      </section>

      <main className={styles.content}>
        <div className={styles.leftColumn}>
          <section className={styles.section}>
            <SectionHeading icon={<BriefcaseBusiness />}>KINH NGHIỆM LÀM VIỆC</SectionHeading>
            {experiences.length ? experiences.map((experience, index) => (
              <article className={styles.experience} key={`${experience.company}-${index}`}>
                <strong>{valueOrDash(experience.company)}</strong>
                <span>{valueOrDash(experience.position)}</span>
                <span>{valueOrDash(experience.from)}{experience.to ? ` – ${experience.to}` : ''}</span>
                {experience.description && <ul>{splitIntoBullets(experience.description).map((bullet, bulletIndex) => <li key={`${bullet}-${bulletIndex}`}>{bullet}</li>)}</ul>}
              </article>
            )) : <span className={styles.muted}>—</span>}
          </section>

          <section className={styles.section}>
            <SectionHeading icon={<GraduationCap />}>HỌC VẤN</SectionHeading>
            <strong>{[candidate.education, candidate.school].filter(Boolean).join(' ') || '—'}</strong>
            <span>Chuyên ngành: {valueOrDash(candidate.major)}</span>
          </section>

          <section className={styles.section}>
            <SectionHeading icon={<Info />}>THÔNG TIN BỔ SUNG</SectionHeading>
            {notes.length ? <ul className={styles.notes}>{notes.map((note, index) => <li key={`${note}-${index}`}>{note}</li>)}</ul> : <span className={styles.muted}>—</span>}
          </section>
        </div>

        <aside className={styles.requirementBox}>
          <h2>THÔNG TIN YÊU CẦU</h2>
          <RequirementRow label="Điện thoại (smartphone)" value={candidate.smartphone} />
          <RequirementRow label="Phương tiện di chuyển" value={candidate.vehicle} />
          <RequirementRow label="Giờ làm việc có thể nhận" value={candidate.hours} />
          <RequirementRow label="Sẵn sàng di chuyển" value={candidate.mobility} />
          <RequirementRow label="Kinh nghiệm COD" value={candidate.cod} />
        </aside>
      </main>

      <footer className={styles.footer}>
        <span>{formatGeneratedAt(generatedAt)}</span>
        <span>FTU KTE507 | Nhóm 06</span>
      </footer>
    </div>
  );
}

export type { Candidate as CVCandidate, Experience as CVExperience };
