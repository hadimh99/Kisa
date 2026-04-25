import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, CheckSquare, Activity, Book, LayoutGrid, User, CheckCircle2, PlaySquare, AlertTriangle, ArrowRight } from 'lucide-react';

const CMSDashboard = ({ supabase, onEditHadith }) => {
    const [metrics, setMetrics] = useState({ hadiths: 0, concepts: 0, transcripts: 0 });
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [goals, setGoals] = useState([]);
    const [newGoal, setNewGoal] = useState('');
    const [activity, setActivity] = useState([]);
    const [alerts, setAlerts] = useState([]); // NEW: Action Inbox State
    const [activityTab, setActivityTab] = useState('mine');
    const [currentUser, setCurrentUser] = useState('Admin');

    useEffect(() => {
        fetchDashboardData();
    }, [supabase]);

    const fetchDashboardData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const userEmail = session?.user?.email || 'Admin';
        const formattedUser = userEmail.split('@')[0];
        setCurrentUser(formattedUser);

        // 1. Fetch Metrics
        const [hadithsRes, conceptsRes, transcriptsRes] = await Promise.all([
            supabase.from('kisa_hadiths').select('*', { count: 'exact', head: true }).not('manual_body', 'is', null).is('is_trashed', false),
            supabase.from('ontology_concepts').select('*', { count: 'exact', head: true }),
            supabase.from('kisa_series_config').select('*', { count: 'exact', head: true }).is('is_hidden', false)
        ]);

        setMetrics({
            hadiths: hadithsRes.count || 0,
            concepts: conceptsRes.count || 0,
            transcripts: transcriptsRes.count || 0
        });

        // 2. Fetch Team Messages (Limit increased to 500 for deep history)
        const { data: msgData } = await supabase.from('cms_messages').select('*').order('created_at', { ascending: false }).limit(500);
        if (msgData) setMessages(msgData);

        // 3. Fetch Weekly Goals
        const { data: goalData } = await supabase.from('cms_goals').select('*').order('created_at', { ascending: false });
        if (goalData) setGoals(goalData);

        // 4. Fetch Activity Logs
        const { data: actData } = await supabase.from('cms_activity_logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (actData) setActivity(actData);

        // 5. NEW: Fetch Action Alerts (Flagged Hadiths)
        const { data: alertsData } = await supabase
            .from('kisa_hadiths')
            .select('id, book, volume, hadith_number, assigned_to, internal_notes')
            .eq('is_flagged', true)
            .is('is_trashed', false)
            .order('updated_at', { ascending: false });
        if (alertsData) setAlerts(alertsData);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        const msg = { sender: currentUser, message: newMessage };
        const { data, error } = await supabase.from('cms_messages').insert([msg]).select();
        if (!error && data) {
            setMessages([data[0], ...messages]);
            setNewMessage('');
        }
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        if (!newGoal.trim()) return;
        const goal = { task_text: newGoal, added_by: currentUser, is_completed: false };
        const { data, error } = await supabase.from('cms_goals').insert([goal]).select();
        if (!error && data) {
            setGoals([data[0], ...goals]);
            setNewGoal('');
        }
    };

    const toggleGoal = async (id, currentState) => {
        const { error } = await supabase.from('cms_goals').update({ is_completed: !currentState }).eq('id', id);
        if (!error) {
            setGoals(goals.map(g => g.id === id ? { ...g, is_completed: !currentState } : g));
        }
    };

    const activeGoals = goals.filter(g => !g.is_completed);
    const completedGoals = goals.filter(g => g.is_completed);
    const myActivity = activity.filter(a => a.user_name === currentUser);
    const teamActivity = activity.filter(a => a.user_name !== currentUser);
    const displayedActivity = activityTab === 'mine' ? myActivity : teamActivity;

    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-10">
            {/* Header & Global Search */}
            <div className="flex flex-col gap-6 border-b border-zinc-800 pb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {currentUser}.</h1>
                    <p className="text-zinc-400 mt-1">The CMS is stable. Here is what needs your attention today.</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[#c6a87c] transition-colors" />
                    <input
                        type="text"
                        placeholder="Global Search: Look up a Concept or Hadith ID..."
                        className="w-full bg-[#121212] border border-zinc-800 hover:border-zinc-700 focus:border-[#c6a87c] rounded-2xl py-4 pl-12 pr-6 text-zinc-200 outline-none shadow-inner transition-all text-sm"
                    />
                </div>
            </div>

            {/* NEW: Action Inbox (Clickable) */}
            {alerts.length > 0 && (
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                        <h2 className="text-lg font-bold text-amber-500 tracking-wide uppercase">Action Inbox ({alerts.length} Flagged Items)</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {alerts.slice(0, 4).map(alert => (
                            <div
                                key={alert.id}
                                onClick={() => onEditHadith(alert.id)}
                                className="bg-black/40 border border-amber-500/20 rounded-xl p-4 flex justify-between items-center group hover:border-amber-500/50 hover:bg-amber-900/10 cursor-pointer transition-colors"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded">{alert.assigned_to || 'UNASSIGNED'}</span>
                                        <span className="text-sm font-semibold text-zinc-300 group-hover:text-amber-500 transition-colors">{alert.book} Vol {alert.volume} #{alert.hadith_number}</span>
                                    </div>
                                    <p className="text-xs text-zinc-500 line-clamp-1">{alert.internal_notes || 'No internal notes provided.'}</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 flex flex-col shadow-lg">
                    <div className="flex items-center gap-3 text-zinc-400 mb-4">
                        <Book className="w-5 h-5 text-[#c6a87c]" />
                        <span className="text-xs font-bold uppercase tracking-widest">Hadith Pipeline</span>
                    </div>
                    <div className="text-3xl font-black text-white">{metrics.hadiths.toLocaleString()} <span className="text-sm font-normal text-zinc-500">Cleaned</span></div>
                </div>
                <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 flex flex-col shadow-lg">
                    <div className="flex items-center gap-3 text-zinc-400 mb-4">
                        <LayoutGrid className="w-5 h-5 text-[#c6a87c]" />
                        <span className="text-xs font-bold uppercase tracking-widest">Brain Ontology</span>
                    </div>
                    <div className="text-3xl font-black text-white">{metrics.concepts.toLocaleString()} <span className="text-sm font-normal text-zinc-500">Concepts</span></div>
                </div>
                <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 flex flex-col shadow-lg">
                    <div className="flex items-center gap-3 text-zinc-400 mb-4">
                        <PlaySquare className="w-5 h-5 text-[#c6a87c]" />
                        <span className="text-xs font-bold uppercase tracking-widest">Transcript Studio</span>
                    </div>
                    <div className="text-3xl font-black text-white">{metrics.transcripts.toLocaleString()} <span className="text-sm font-normal text-zinc-500">Published</span></div>
                </div>
            </div>

            {/* Collaboration & Tasks Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Noticeboard */}
                <div className="bg-[#121212] border border-zinc-800 rounded-2xl flex flex-col shadow-lg overflow-hidden h-[400px]">
                    <div className="bg-zinc-900/50 p-4 border-b border-zinc-800 flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-amber-500" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Team Noticeboard</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-4">
                        {messages.length === 0 ? (
                            <div className="text-center text-zinc-600 text-sm mt-10">No recent messages.</div>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.sender === currentUser ? 'self-end items-end' : 'self-start items-start'}`}>
                                    <span className="text-[10px] text-zinc-500 font-mono mb-1 px-1">{msg.sender}</span>
                                    <div className={`p-3 rounded-2xl text-sm ${msg.sender === currentUser ? 'bg-[#c6a87c]/10 border border-[#c6a87c]/30 text-zinc-200 rounded-tr-sm' : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm'}`}>
                                        {msg.message}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800 bg-black/20 flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Leave a note for the team..."
                            className="flex-1 bg-[#1c1c1e] border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-[#c6a87c]"
                        />
                        <button type="submit" className="bg-[#c6a87c] text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#b0956b] transition-colors">Send</button>
                    </form>
                </div>

                {/* Weekly Goals */}
                <div className="bg-[#121212] border border-zinc-800 rounded-2xl flex flex-col shadow-lg overflow-hidden h-[400px]">
                    <div className="bg-zinc-900/50 p-4 border-b border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckSquare className="w-5 h-5 text-green-500" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">Shared Weekly Goals</h3>
                        </div>
                        <span className="text-xs font-mono text-zinc-500">{activeGoals.length} Pending</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                        {activeGoals.map(goal => (
                            <div key={goal.id} className="flex items-start gap-3 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/50 hover:border-zinc-600 transition-colors group">
                                <button onClick={() => toggleGoal(goal.id, goal.is_completed)} className="mt-0.5 shrink-0 text-zinc-600 group-hover:text-green-500 transition-colors">
                                    <div className="w-5 h-5 rounded border-2 border-current flex items-center justify-center"></div>
                                </button>
                                <div>
                                    <p className="text-sm text-zinc-300 leading-snug">{goal.task_text}</p>
                                    <p className="text-[10px] text-zinc-600 font-mono mt-1">Added by {goal.added_by}</p>
                                </div>
                            </div>
                        ))}

                        {completedGoals.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-800/50">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 pl-1">Completed This Week</h4>
                                {completedGoals.map(goal => (
                                    <div key={goal.id} className="flex items-center gap-3 py-1.5 pl-1 opacity-50">
                                        <button onClick={() => toggleGoal(goal.id, goal.is_completed)} className="text-green-500"><CheckCircle2 className="w-4 h-4" /></button>
                                        <p className="text-xs text-zinc-400 line-through">{goal.task_text}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <form onSubmit={handleAddGoal} className="p-4 border-t border-zinc-800 bg-black/20 flex gap-2">
                        <input
                            type="text"
                            value={newGoal}
                            onChange={(e) => setNewGoal(e.target.value)}
                            placeholder="Add a new goal..."
                            className="flex-1 bg-[#1c1c1e] border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-green-500"
                        />
                        <button type="submit" className="bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-700 transition-colors">Add</button>
                    </form>
                </div>
            </div>

            {/* 90-Day Activity Ledger */}
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl flex flex-col shadow-lg overflow-hidden">
                <div className="bg-zinc-900/50 p-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-blue-400" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">90-Day Activity Ledger</h3>
                    </div>
                    <div className="flex bg-black p-1 rounded-lg border border-zinc-800">
                        <button
                            onClick={() => setActivityTab('mine')}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${activityTab === 'mine' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            My Activity
                        </button>
                        <button
                            onClick={() => setActivityTab('team')}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${activityTab === 'team' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Co-Admin Activity
                        </button>
                    </div>
                </div>
                <div className="p-4 max-h-[300px] overflow-y-auto">
                    {displayedActivity.length === 0 ? (
                        <div className="text-center text-zinc-600 text-sm py-10">No recent activity recorded in this view.</div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {displayedActivity.map(log => (
                                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900/50 transition-colors border border-transparent hover:border-zinc-800/80">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-900/20 border border-blue-900/50 flex items-center justify-center text-blue-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-zinc-200"><span className="font-semibold text-white">{log.user_name}</span> {log.action_type}</p>
                                            <p className="text-xs text-zinc-500">{log.details}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-600 bg-black px-2 py-1 rounded">
                                        {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CMSDashboard;