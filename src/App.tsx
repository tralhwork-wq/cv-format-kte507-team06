import { ChangeEvent, FormEvent, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import mammoth from 'mammoth';
import { CircleAlert as AlertCircle, BriefcaseBusiness, Check, ChevronDown, FileText, FileUp, ImagePlus, RefreshCw, Trash2, UserRound, X, Zap } from 'lucide-react';
import CVTemplate from './components/CVTemplate';
import './components/CVPreviewFrame.css';

type Experience = { company: string; position: string; from: string; to: string; description: string };
type Candidate = { name: string; phone: string; email: string; birthYear: string; location: string; education: string; school: string; major: string; smartphone: string; vehicle: string; hours: string; mobility: string; cod: string; notes: string; experiences: Experience[] };

const emptyExperience: Experience = { company: '', position: '', from: '', to: '', description: '' };
const initialCandidate: Candidate = {
  name: 'Nguyễn Văn An', phone: '0987 654 321', email: 'nguyenvanan@gmail.com', birthYear: '2003', location: 'Hà Nội', education: 'Cao đẳng', school: 'Cao đẳng Kinh tế – Kỹ thuật', major: 'Quản trị kinh doanh', smartphone: 'Samsung A15', vehicle: 'Xe máy Honda Vision', hours: '7:00 – 19:30', mobility: '50–60 km/ngày', cod: 'Thành thạo', notes: 'Ứng viên nhiệt tình, giao tiếp tốt.', experiences: [{ company: 'Giao hàng nhanh (GHN)', position: 'Nhân viên giao nhận', from: '06/2023', to: '04/2024', description: 'Nhận hàng, giao hàng theo tuyến. Thu hộ COD, đối soát cuối ngày.' }],
};
const emptyCandidate = (): Candidate => ({ ...initialCandidate, name: '', phone: '', email: '', birthYear: '', location: '', education: '', school: '', major: '', smartphone: '', vehicle: '', hours: '', mobility: '', cod: '', notes: '', experiences: [{ ...emptyExperience }] });
const getField = (text: string, labels: string[]) => { const label = labels.find((item) => new RegExp(`${item}\\s*[:：-]`, 'i').test(text)); if (!label) return ''; const match = text.match(new RegExp(`${label}\\s*[:：-]\\s*([^\\n|\\t]+)`, 'i')); return match?.[1]?.trim() ?? ''; };
const normalisePhone = (value: string) => value.replace(/[^\d+]/g, '').replace(/^\+84/, '0');

function App() {
  const [candidate, setCandidate] = useState<Candidate>(initialCandidate);
  const [rowText, setRowText] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [photo, setPhoto] = useState('');
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const [savingSheet, setSavingSheet] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(new Date());
  const previewRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const requiredMissing = useMemo(() => !candidate.name.trim() || !candidate.phone.trim() || !candidate.location.trim(), [candidate]);

  const updateCandidate = (key: keyof Candidate, value: string) => { setCandidate((current) => ({ ...current, [key]: value })); setMissingFields((fields) => fields.filter((field) => field !== key)); };
  const updateExperience = (index: number, key: keyof Experience, value: string) => setCandidate((current) => ({ ...current, experiences: current.experiences.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  const notify = (message: string, type: 'success' | 'error' = 'success') => { setStatus(message); setStatusType(type); };
  const refreshPreview = () => { setGeneratedAt(new Date()); notify('Bản xem trước đã được cập nhật.'); };
  const reset = () => { setCandidate(emptyCandidate()); setRowText(''); setPhoto(''); setFileName(''); setMissingFields([]); notify('Đã làm mới biểu mẫu.'); };

  const parseText = (rawText: string) => {
    const text = rawText.replace(/\r/g, '');
    const tabs = text.split('\n').find((line) => line.includes('\t'))?.split('\t').map((value) => value.trim()) ?? text.split(/\t|\|/).map((value) => value.trim());
    const email = text.match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] ?? '';
    const phoneMatch = text.match(/(?:\+84|0)(?:[ .-]?\d){8,10}/);
    const phone = phoneMatch ? normalisePhone(phoneMatch[0]) : '';
    const year = text.match(/(?:19|20)\d{2}/)?.[0] ?? '';
    const byLabel = (labels: string[]) => getField(text, labels);
    const mapped: Partial<Candidate> = {
      name: byLabel(['họ và tên', 'họ tên', 'full name']) || tabs[0] || '', phone: byLabel(['sđt', 'số điện thoại', 'điện thoại']) || phone || tabs[1] || '', email: byLabel(['email']) || email || tabs[2] || '', birthYear: byLabel(['năm sinh', 'ns']) || year, location: byLabel(['khu vực', 'tỉnh thành', 'địa chỉ']) || '', education: byLabel(['trình độ', 'học vấn']) || '', school: byLabel(['tên trường', 'trường']) || '', major: byLabel(['chuyên ngành', 'ngành']) || '', smartphone: byLabel(['smartphone', 'điện thoại thông minh']) || '', vehicle: byLabel(['phương tiện', 'xe']) || '', hours: byLabel(['giờ làm', 'giờ làm việc']) || '', mobility: byLabel(['di chuyển', 'khả năng di chuyển']) || '', notes: byLabel(['ghi chú', 'note']) || '',
    };
    const cod = byLabel(['cod', 'kinh nghiệm cod']);
    if (cod) mapped.cod = ['Thành thạo', 'Có kinh nghiệm cơ bản', 'Chưa có kinh nghiệm'].find((value) => cod.toLowerCase().includes(value.toLowerCase())) ?? '';
    const missing = Object.entries(mapped).filter(([key, value]) => !value && key !== 'experiences').map(([key]) => key);
    const experienceText = byLabel(['công việc', 'kinh nghiệm', 'kinh nghiệm làm việc']);
    setCandidate((current) => ({ ...current, ...mapped, experiences: experienceText ? [{ ...current.experiences[0], description: experienceText }] : current.experiences }));
    setMissingFields(missing);
    notify(missing.length ? 'Đã phân tích. Các trường chưa nhận diện được được đánh dấu để PIC bổ sung.' : 'Đã phân tích và điền thông tin thành công.');
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return; setFileName(file.name);
    try {
      let text = '';
      if (file.name.toLowerCase().endsWith('.docx')) { text = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value; }
      else if (file.name.toLowerCase().endsWith('.pdf')) {
        const raw = new TextDecoder('latin1').decode(await file.arrayBuffer());
        text = [...raw.matchAll(/\(([^()]*)\)/g)].map((match) => match[1]).join(' ');
        if (text.length < 12) throw new Error('pdf');
      } else throw new Error('format');
      parseText(text); if (!text.trim()) throw new Error('empty');
    } catch { notify('Không thể trích xuất đủ nội dung file. Vui lòng kiểm tra file hoặc nhập trực tiếp vào biểu mẫu.', 'error'); }
  };

  const handlePhoto = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setPhoto(String(reader.result)); reader.readAsDataURL(file); };
  const downloadPdf = async () => {
    if (!previewRef.current) return;
    const timestamp = new Date();
    setGeneratedAt(timestamp);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
    await Promise.all([
      ...Array.from(previewRef.current.querySelectorAll('img')).map((img) => img.complete && img.naturalWidth > 0 ? Promise.resolve() : new Promise<void>((resolve) => { img.addEventListener('load', () => resolve(), { once: true }); img.addEventListener('error', () => resolve(), { once: true }); })),
    ]);
    const clone = previewRef.current.cloneNode(true) as HTMLElement;
    clone.classList.remove('cv-scaled-preview');
    clone.style.transform = 'none';
    clone.style.margin = '0';
    const stage = document.createElement('div');
    stage.style.position = 'fixed';
    stage.style.left = '-10000px';
    stage.style.top = '0';
    stage.style.width = '794px';
    stage.style.background = '#fff';
    stage.appendChild(clone);
    document.body.appendChild(stage);
    try {
      const canvas = await html2canvas(clone, { scale: 3, backgroundColor: '#fff', useCORS: true, width: 794, height: 1123, windowWidth: 794, windowHeight: 1123 });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const offset = Math.max(0, (297 - imgHeight) / 2);
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, offset, imgWidth, imgHeight);
      pdf.save(`VTP_BuuTa_${(candidate.name || 'ung-vien').replace(/\s+/g, '_')}.pdf`);
    } finally {
      document.body.removeChild(stage);
    }
  };
  const saveToSheet = async () => { const endpoint = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL as string | undefined; if (!endpoint) { notify('Chưa cấu hình Google Sheet', 'error'); return; } setSavingSheet(true); setStatus(''); try { const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: candidate.name, phone: candidate.phone, email: candidate.email, birthYear: candidate.birthYear, currentLocation: candidate.location, education: candidate.education, school: candidate.school, major: candidate.major, experiences: candidate.experiences, smartphone: candidate.smartphone, vehicle: candidate.vehicle, workingHours: candidate.hours, mobility: candidate.mobility, codLevel: candidate.cod, picNote: candidate.notes, generatedAt: generatedAt.toISOString(), cvFileUrl: '' }) }); if (!response.ok) throw new Error('save'); notify('Đã lưu thông tin lên Google Sheet.'); } catch { notify('Không thể lưu lên Google Sheet. Vui lòng kiểm tra endpoint và thử lại.', 'error'); } finally { setSavingSheet(false); } };
  const submitRow = (event: FormEvent) => { event.preventDefault(); if (rowText.trim()) parseText(rowText); };

  return <div className="app-shell">
    <header className="topbar"><img className="header-viettel" src="/assets/images/viettel-post-logo-png_seeklogo-470845.png" alt="Viettel Post" /><div className="header-ftu"><img src="/assets/images/Logo-DH-Ngoai-Thuong-FTU.png" alt="Đại học Ngoại thương" /><span>Nhóm 06 | KTE507</span></div></header>
    <div className="workspace"><main className="editor-area">
      <div className="source-grid"><div className="source-card upload-card"><div className="source-icon red"><FileUp size={27} /></div><div><h3>Đã có CV sẵn</h3><p>Tải CV (PDF/Word) lên để trích xuất<br />và tự động điền thông tin.</p></div><button className="red-button" onClick={() => fileRef.current?.click()}>Tải CV lên</button><input ref={fileRef} hidden type="file" accept=".pdf,.docx" onChange={handleFile} />{fileName && <small className="file-status">{fileName}</small>}</div><div className={`source-card form-card ${showPaste ? 'expanded' : ''}`}><button className="source-click" onClick={() => setShowPaste((value) => !value)}><div className="source-icon blue"><FileText size={27} /></div><div><h3>Ứng viên điền Form</h3><p>Dán một hàng dữ liệu từ Google Form<br />hoặc Google Sheet vào ô dưới đây.</p></div></button>{showPaste && <form onSubmit={submitRow}><label className="paste-label">Dán thông tin ứng viên từ Google Sheet</label><textarea value={rowText} onChange={(event) => setRowText(event.target.value)} placeholder="Dán toàn bộ nội dung hàng dữ liệu tại đây..." /><button className="blue-button" type="submit">Phân tích và điền thông tin</button></form>}</div></div>
      <section className="candidate-panel"><div className="section-heading"><div><span className="heading-bar" /><h2>Thông tin ứng viên</h2></div><div className="heading-actions"><button className="sheet-button" onClick={saveToSheet} disabled={savingSheet}>{savingSheet ? 'Đang lưu...' : 'Lưu lên Sheet'}</button><button className="outline-button" onClick={refreshPreview}><Zap size={14} /> Tạo bản xem trước</button></div></div>
        <div className="photo-upload"><div className="photo-thumb">{photo ? <img src={photo} alt="Ảnh ứng viên" /> : <UserRound size={28} />}</div><div><strong>Ảnh chân dung ứng viên</strong><small>JPG, JPEG hoặc PNG. Ảnh sẽ được cắt tròn trên CV.</small><div className="photo-actions"><button className="photo-button" onClick={() => photoRef.current?.click()}><ImagePlus size={14} /> {photo ? 'Thay ảnh' : 'Tải ảnh ứng viên'}</button>{photo && <button className="remove-photo" onClick={() => setPhoto('')}><Trash2 size={14} /> Xóa ảnh</button>}</div></div><input ref={photoRef} hidden type="file" accept="image/jpeg,image/png" onChange={handlePhoto} /></div>
        <div className="form-layout"><div className="form-column"><Field label="Họ và tên" required value={candidate.name} warning={missingFields.includes('name')} onChange={(value) => updateCandidate('name', value)} /><Field label="SĐT" required value={candidate.phone} warning={missingFields.includes('phone')} onChange={(value) => updateCandidate('phone', value)} /><Field label="Email" value={candidate.email} warning={missingFields.includes('email')} onChange={(value) => updateCandidate('email', value)} /><Field label="Năm sinh" value={candidate.birthYear} warning={missingFields.includes('birthYear')} onChange={(value) => updateCandidate('birthYear', value)} /><SelectField label="Khu vực hiện tại" required value={candidate.location} options={['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Khác']} warning={missingFields.includes('location')} onChange={(value) => updateCandidate('location', value)} /><SelectField label="Trình độ cao nhất" value={candidate.education} options={['Cao đẳng', 'Đại học', 'Trung cấp', 'THPT']} warning={missingFields.includes('education')} onChange={(value) => updateCandidate('education', value)} /><Field label="Tên trường" value={candidate.school} warning={missingFields.includes('school')} onChange={(value) => updateCandidate('school', value)} /><Field label="Chuyên ngành" value={candidate.major} warning={missingFields.includes('major')} onChange={(value) => updateCandidate('major', value)} /></div><div className="form-column"><Field label="Điện thoại (smartphone)" value={candidate.smartphone} warning={missingFields.includes('smartphone')} onChange={(value) => updateCandidate('smartphone', value)} /><Field label="Phương tiện di chuyển" value={candidate.vehicle} warning={missingFields.includes('vehicle')} onChange={(value) => updateCandidate('vehicle', value)} /><Field label="Giờ làm việc có thể nhận" value={candidate.hours} warning={missingFields.includes('hours')} onChange={(value) => updateCandidate('hours', value)} /><Field label="Sẵn sàng di chuyển" value={candidate.mobility} warning={missingFields.includes('mobility')} onChange={(value) => updateCandidate('mobility', value)} /><div className="field cod-field"><label>Kinh nghiệm COD</label><div className="radio-list">{['Thành thạo', 'Có kinh nghiệm cơ bản', 'Chưa có kinh nghiệm'].map((value) => <label key={value}><input type="radio" name="cod" checked={candidate.cod === value} onChange={() => updateCandidate('cod', value)} /><span className="radio-dot" />{value}</label>)}</div></div><div className="field"><label>Ghi chú PIC</label><textarea className="input notes-input" value={candidate.notes} onChange={(event) => updateCandidate('notes', event.target.value)} /></div></div></div>
        <div className="experience-editor"><div className="experience-title"><BriefcaseBusiness size={16} /> Kinh nghiệm làm việc <button onClick={() => setCandidate((current) => ({ ...current, experiences: [...current.experiences, { ...emptyExperience }] }))}>+ Thêm kinh nghiệm</button></div>{candidate.experiences.map((experience, index) => <div className="experience-row" key={index}><Field label="Công ty" value={experience.company} onChange={(value) => updateExperience(index, 'company', value)} /><Field label="Vị trí" value={experience.position} onChange={(value) => updateExperience(index, 'position', value)} /><Field label="Từ tháng/năm" value={experience.from} onChange={(value) => updateExperience(index, 'from', value)} /><Field label="Đến tháng/năm" value={experience.to} onChange={(value) => updateExperience(index, 'to', value)} /><Field label="Mô tả ngắn" value={experience.description} onChange={(value) => updateExperience(index, 'description', value)} />{candidate.experiences.length > 1 && <button className="remove-exp" onClick={() => setCandidate((current) => ({ ...current, experiences: current.experiences.filter((_, itemIndex) => itemIndex !== index) }))}><X size={15} /></button>}</div>)}</div>
      </section><div className="bottom-actions"><button className="secondary-action" onClick={reset}><RefreshCw size={16} /> Làm mới</button><button className="primary-action" onClick={refreshPreview}><Zap size={16} /> Tạo bản xem trước</button></div>{status && <div className={`status-message ${statusType}`}><Check size={15} /> {status}</div>}
    </main><section className="preview-area"><div className="preview-heading"><h2>Xem trước CV (A4)</h2><button className="pdf-button" onClick={downloadPdf}><FileText size={16} /> Xuất PDF</button></div>{requiredMissing && <div className="warning"><AlertCircle size={16} /> Vui lòng điền các trường có dấu * trước khi xuất bản.</div>}<div className="preview-frame"><CVTemplate candidate={candidate} photo={photo} generatedAt={generatedAt} pageRef={previewRef} className="cv-scaled-preview" /></div></section></div>
  </div>;
}

function Field({ label, value, onChange, required = false, warning = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; warning?: boolean }) { return <div className="field"><label>{label}{required && <em> *</em>}</label><input className={`input ${warning ? 'needs-review' : ''}`} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function SelectField({ label, value, options, onChange, required = false, warning = false }: { label: string; value: string; options: string[]; onChange: (value: string) => void; required?: boolean; warning?: boolean }) { return <div className="field"><label>{label}{required && <em> *</em>}</label><div className="select-wrap"><select className={`input ${warning ? 'needs-review' : ''}`} value={value} onChange={(event) => onChange(event.target.value)}><option value="">Chọn thông tin</option>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={14} /></div></div>; }
export default App;
