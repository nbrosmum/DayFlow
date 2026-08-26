'use client';

import { BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, Circle, Clock3, Inbox, MoreHorizontal, Plus, Repeat2, Search, Settings, Sparkles, Sunrise } from 'lucide-react';
import { useMemo, useState } from 'react';

type Task = { id: number; title: string; meta: string; time?: string; duration: string; accent: 'coral' | 'blue' | 'green' | 'yellow'; done: boolean };

const initialTasks: Task[] = [
  { id: 1, title: 'Morning reset', meta: 'Routine · 4 of 5 steps', time: '7:30', duration: '25m', accent: 'yellow', done: true },
  { id: 2, title: 'Write project proposal', meta: 'Deep work · High priority', time: '9:00', duration: '1h 30m', accent: 'coral', done: false },
  { id: 3, title: 'Lunch and short walk', meta: 'Personal', time: '12:30', duration: '45m', accent: 'green', done: false },
  { id: 4, title: 'Review research notes', meta: 'DayFlow project', time: '2:00', duration: '50m', accent: 'blue', done: false },
];

const navItems = [
  { label: 'Today', icon: Sunrise },
  { label: 'Week', icon: CalendarDays },
  { label: 'Inbox', icon: Inbox, badge: 3 },
  { label: 'Routines', icon: Repeat2 },
  { label: 'Review', icon: BookOpen },
];

export default function Home() {
  const [tasks, setTasks] = useState(initialTasks);
  const [draft, setDraft] = useState('');
  const [activeNav, setActiveNav] = useState('Today');
  const [showPlan, setShowPlan] = useState(false);
  const completed = tasks.filter((task) => task.done).length;
  const progress = Math.round((completed / tasks.length) * 100);
  const greeting = useMemo(() => new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening', []);

  function toggleTask(id: number) {
    setTasks((items) => items.map((item) => item.id === id ? { ...item, done: !item.done } : item));
  }

  function addTask() {
    const title = draft.trim();
    if (!title) return;
    setTasks((items) => [...items, { id: Date.now(), title, meta: 'Added to today', duration: '30m', accent: 'blue', done: false }]);
    setDraft('');
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Check size={18} strokeWidth={3} /></div><span>DayFlow</span></div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon, badge }) => (
            <button key={label} className={activeNav === label ? 'nav-item active' : 'nav-item'} onClick={() => setActiveNav(label)}>
              <Icon size={19} /><span>{label}</span>{badge ? <span className="nav-badge">{badge}</span> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item"><Search size={19} /><span>Search</span></button>
          <button className="nav-item"><Settings size={19} /><span>Settings</span></button>
          <div className="profile-chip"><span className="avatar">Y</span><span><strong>Your space</strong><small>Synced just now</small></span></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark"><Check size={16} strokeWidth={3} /></div><strong>DayFlow</strong></div>
          <div className="date-switcher">
            <button className="icon-button" aria-label="Previous day"><ChevronLeft size={19} /></button>
            <button className="date-button">Today, Aug 26</button>
            <button className="icon-button" aria-label="Next day"><ChevronRight size={19} /></button>
          </div>
          <div className="top-actions"><button className="icon-button" aria-label="More options"><MoreHorizontal size={20} /></button><button className="ai-button" onClick={() => setShowPlan(true)}><Sparkles size={17} /> Plan day</button></div>
        </header>

        <div className="content-grid">
          {activeNav === 'Today' ? <>
          <div className="day-column">
            <header className="day-heading">
              <div><p className="eyebrow">Wednesday · 26 August</p><h1>{greeting}</h1><p className="subtitle">A focused day with enough room to breathe.</p></div>
              <div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}><span>{completed}/{tasks.length}</span></div>
            </header>

            <form className="quick-add" onSubmit={(event) => { event.preventDefault(); addTask(); }}>
              <Plus size={20} /><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Add a task or type naturally…" aria-label="New task" /><span className="quick-hint">Enter</span>
            </form>

            <section aria-labelledby="timeline-title">
              <div className="section-heading"><h2 id="timeline-title">Your timeline</h2><span>{tasks.filter((task) => !task.done).length} remaining</span></div>
              <div className="timeline">
                {tasks.map((task, index) => (
                  <article className={task.done ? 'timeline-row completed' : 'timeline-row'} key={task.id}>
                    <div className="time-label">{task.time ?? 'Anytime'}</div>
                    <div className="timeline-track"><span className={`timeline-dot ${task.accent}`} />{index < tasks.length - 1 ? <span className="timeline-line" /> : null}</div>
                    <div className={`task-card ${task.accent}`}>
                      <button className="check-button" onClick={() => toggleTask(task.id)} aria-label={`${task.done ? 'Reopen' : 'Complete'} ${task.title}`}>{task.done ? <Check size={15} strokeWidth={3} /> : <Circle size={18} />}</button>
                      <div className="task-copy"><h3>{task.title}</h3><p>{task.meta}</p></div>
                      <span className="duration"><Clock3 size={14} />{task.duration}</span>
                      <button className="task-menu" aria-label={`Options for ${task.title}`}><MoreHorizontal size={18} /></button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="insight-column">
            <section className="focus-panel"><span className="panel-icon"><Sparkles size={18} /></span><p className="eyebrow">Focus check</p><h2>Your plan looks balanced.</h2><p>You have 3 hours of focused work with useful breaks in between.</p><button>Review plan <ChevronRight size={16} /></button></section>
            <section className="up-next"><div className="section-heading"><h2>Up next</h2><span>9:00</span></div><div className="next-task"><span className="accent-line" /><div><strong>Write project proposal</strong><small>Starts in 34 minutes</small></div></div></section>
            <section className="routine-card"><div className="section-heading"><h2>Morning routine</h2><span>80%</span></div><div className="routine-progress"><span /></div><p>4 of 5 steps complete</p></section>
          </aside>
          </> : <SecondaryView view={activeNav} tasks={tasks} onToggle={toggleTask} />}
        </div>
      </section>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 4).map(({ label, icon: Icon }) => <button key={label} className={activeNav === label ? 'active' : ''} onClick={() => setActiveNav(label)}><Icon size={20} /><span>{label}</span></button>)}
      </nav>
      {showPlan ? <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowPlan(false)}><section className="plan-modal" role="dialog" aria-modal="true" aria-labelledby="plan-title" onMouseDown={(event) => event.stopPropagation()}><span className="panel-icon"><Sparkles size={18} /></span><p className="eyebrow">AI planning assistant</p><h2 id="plan-title">A calmer plan for today</h2><p>I moved research after lunch and protected a 90-minute focus block for your proposal. Nothing changes until you approve.</p><div className="plan-change"><span>9:00</span><strong>Write project proposal</strong><small>90 min focus block</small></div><div className="plan-change"><span>2:00</span><strong>Review research notes</strong><small>50 min · after recovery time</small></div><div className="modal-actions"><button className="secondary-button" onClick={() => setShowPlan(false)}>Not now</button><button className="ai-button" onClick={() => setShowPlan(false)}><Check size={16}/> Apply plan</button></div></section></div> : null}
    </main>
  );
}

function SecondaryView({ view, tasks, onToggle }: { view: string; tasks: Task[]; onToggle: (id: number) => void }) {
  if (view === 'Week') return <section className="full-view"><p className="eyebrow">26 August – 1 September</p><h1>Your week</h1><p className="subtitle">Plan capacity before the details.</p><div className="week-grid">{['Mon 24','Tue 25','Wed 26','Thu 27','Fri 28','Sat 29','Sun 30'].map((day, index) => <article key={day} className={index === 2 ? 'day-card current' : 'day-card'}><strong>{day}</strong><span className="capacity"><i style={{width:`${[65,40,75,55,35,20,10][index]}%`}}/></span><small>{[3,2,4,3,2,1,0][index]} tasks</small>{index === 2 ? tasks.slice(0,2).map(task => <p key={task.id}>{task.title}</p>) : null}</article>)}</div></section>;
  if (view === 'Routines') return <section className="full-view"><p className="eyebrow">Repeat what works</p><h1>Routines</h1><p className="subtitle">Small systems that make the day easier.</p><div className="routine-grid"><Routine title="Morning reset" time="25 min" steps={['Drink water','Stretch for five minutes','Review today’s plan','Read for ten minutes','Start focus mode']} done={4}/><Routine title="Evening shutdown" time="20 min" steps={['Clear inbox','Review unfinished work','Write today’s win','Prepare tomorrow','Put phone away']} done={1}/></div></section>;
  if (view === 'Review') return <section className="full-view review-view"><p className="eyebrow">Wednesday · Daily review</p><h1>Close the day well</h1><p className="subtitle">Notice what worked, then let the rest go.</p><label>How did today feel?<div className="mood-row">{['Low','Flat','Okay','Good','Great'].map(mood => <button key={mood}>{mood}</button>)}</div></label><label>Today’s win<textarea placeholder="What are you glad you completed?" /></label><label>A note for tomorrow<textarea placeholder="Anything worth carrying forward?" /></label><button className="ai-button"><Sparkles size={16}/> Summarize my day</button></section>;
  return <section className="full-view"><p className="eyebrow">Captured for later</p><h1>Inbox</h1><p className="subtitle">Decide what belongs in your week.</p><div className="inbox-list">{tasks.filter(task => !task.done).map(task => <button key={task.id} onClick={() => onToggle(task.id)}><Circle size={18}/><span><strong>{task.title}</strong><small>{task.meta}</small></span><ChevronRight size={17}/></button>)}</div></section>;
}

function Routine({ title, time, steps, done }: { title: string; time: string; steps: string[]; done: number }) {
  return <article className="routine-panel"><div className="section-heading"><h2>{title}</h2><span>{time}</span></div>{steps.map((step,index) => <div className={index < done ? 'routine-step done' : 'routine-step'} key={step}>{index < done ? <Check size={14}/> : <Circle size={16}/>}<span>{step}</span></div>)}</article>;
}
