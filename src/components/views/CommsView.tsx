/**
 * AEGIS GRID — Team Communication & Tactical Audio Messaging Workspace
 * Real-time messaging, audio voice notes, squad channels, private 1-on-1 messaging,
 * delivery indicators, and emergency priority broadcast support.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAegis } from '../../context/AegisContext';
import { MessagePriority, Participant } from '../../types';
import {
  Send,
  Search,
  Hash,
  RotateCw,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Radio,
  WifiOff,
  RefreshCw,
  X,
  Users2,
  Mic,
  MicOff,
  Play,
  Pause,
  Volume2,
  AlertTriangle,
  User,
  Shield,
} from 'lucide-react';

export const CommsView: React.FC = () => {
  const {
    messages,
    sendMessage,
    sendAudioMessage,
    retryPendingMessage,
    discardPendingMessage,
    clearConversation,
    isSimulatedOffline,
    userProfile,
    teams,
    participants,
    setCurrentView,
    addToast,
  } = useAegis();

  const [activeChannel, setActiveChannel] = useState<string>('all-community');
  const [inputText, setInputText] = useState('');
  const [priority, setPriority] = useState<MessagePriority>('normal');
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Channels List: Public Rooms + Squad Rooms + 1-on-1 Teammates
  const channels = useMemo(() => {
    const list: {
      id: string;
      name: string;
      title: string;
      description: string;
      type: 'public' | 'team' | 'direct';
      recipientId?: string;
    }[] = [
      {
        id: 'all-community',
        name: 'all-community',
        title: '#all-community',
        description: 'All squads public radio net',
        type: 'public',
      },
      {
        id: 'supplies-and-help',
        name: 'supplies-and-help',
        title: '#supplies-and-help',
        description: 'Logistics, water, power, and supply requests',
        type: 'public',
      },
      {
        id: 'radio-health-updates',
        name: 'radio-health-updates',
        title: '#radio-health-updates',
        description: 'Repeater status and network health checks',
        type: 'public',
      },
    ];

    // Squad rooms
    teams.forEach((t) => {
      list.push({
        id: t.channelId,
        name: t.channelId,
        title: `#${t.channelId}`,
        description: `Dedicated tactical room for ${t.name}`,
        type: 'team',
      });
    });

    // 1-on-1 Direct Personnel
    participants.slice(0, 6).forEach((p) => {
      list.push({
        id: `dm-${p.id}`,
        name: p.callsign,
        title: `@${p.callsign}`,
        description: `Private direct channel with ${p.name} (${p.group})`,
        type: 'direct',
        recipientId: p.id,
      });
    });

    return list;
  }, [teams, participants]);

  // Filter messages for current channel
  const channelMessages = useMemo(() => {
    return messages.filter((m) => {
      if (activeChannel === 'all-community') {
        if (m.channelId !== 'all-community' && m.channelId !== 'general-coordination') return false;
      } else {
        if (m.channelId !== activeChannel) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchContent = m.content.toLowerCase().includes(q);
        const matchSender = m.senderCallsign.toLowerCase().includes(q);
        return matchContent || matchSender;
      }
      return true;
    });
  }, [messages, activeChannel, searchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelMessages.length]);

  const currentChannelInfo = channels.find((c) => c.id === activeChannel) || channels[0];

  // Text Send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    await sendMessage(
      activeChannel,
      inputText,
      priority,
      currentChannelInfo.type === 'team' ? activeChannel : undefined,
      currentChannelInfo.recipientId
    );
    setInputText('');
    setPriority('normal');
  };

  // Start Audio Recording
  const startAudioRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      addToast('error', 'Audio Unsupported', 'Browser does not support audio recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await sendAudioMessage(
            activeChannel,
            base64Audio,
            recordSeconds,
            priority,
            currentChannelInfo.recipientId
          );
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);

      addToast('info', 'Recording Voice Note', 'Speak into microphone. Press stop to transmit.');
    } catch (err) {
      console.warn('Microphone permission error:', err);
      addToast('warning', 'Microphone Denied', 'Please grant microphone access to record voice notes.');
    }
  };

  // Stop Audio Recording
  const stopAudioRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Play / Pause Audio Clip
  const togglePlayAudio = (msgId: string, audioDataUrl: string) => {
    if (playingAudioId === msgId) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(audioDataUrl);
    audioPlayerRef.current = audio;
    setPlayingAudioId(msgId);

    audio.play();
    audio.onended = () => {
      setPlayingAudioId(null);
    };
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col md:flex-row overflow-hidden bg-[#080D12]">
      {/* 1. Left Channel & Personnel Directory */}
      <div className="w-full md:w-80 bg-[#111922] border-r border-[#17232D] flex flex-col justify-between shrink-0">
        <div className="overflow-y-auto flex-1">
          {/* Header */}
          <div className="p-4 border-b border-[#17232D]">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-black text-[#F3F7FA] font-display flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#9FE870]" />
                Tactical Comms Net
              </h2>
              <button
                onClick={() => setCurrentView('community')}
                className="text-[11px] font-bold text-[#48DDF2] hover:underline flex items-center gap-1 font-display"
              >
                <Users2 className="w-3.5 h-3.5" />
                Squads
              </button>
            </div>
            <p className="text-[11px] text-[#8495A5]">
              Real-time message synchronization with offline-ready local cache.
            </p>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-[#17232D]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8495A5] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-lg text-xs text-[#F3F7FA] outline-none"
              />
            </div>
          </div>

          {/* Channels Sections */}
          <div className="p-3 space-y-4">
            {/* Public Channels */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#8495A5] uppercase tracking-wider block px-2">
                Public Broadcast Channels
              </span>
              {channels
                .filter((c) => c.type === 'public')
                .map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between ${
                      activeChannel === ch.id
                        ? 'bg-[#17232D] border border-[#48DDF2]/50 text-[#F3F7FA] shadow-md'
                        : 'hover:bg-[#17232D]/40 text-[#8495A5] hover:text-[#F3F7FA]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Hash className="w-3.5 h-3.5 text-[#48DDF2] shrink-0" />
                      <span className="text-xs font-bold font-display truncate">{ch.title}</span>
                    </div>
                  </button>
                ))}
            </div>

            {/* Squad Channels */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#8495A5] uppercase tracking-wider block px-2">
                Squad Radio Rooms
              </span>
              {channels
                .filter((c) => c.type === 'team')
                .map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between ${
                      activeChannel === ch.id
                        ? 'bg-[#17232D] border border-[#9FE870]/50 text-[#F3F7FA] shadow-md'
                        : 'hover:bg-[#17232D]/40 text-[#8495A5] hover:text-[#F3F7FA]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Users2 className="w-3.5 h-3.5 text-[#9FE870] shrink-0" />
                      <span className="text-xs font-bold font-display truncate">{ch.title}</span>
                    </div>
                  </button>
                ))}
            </div>

            {/* Direct Messages */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#8495A5] uppercase tracking-wider block px-2">
                Direct 1-on-1 Messages
              </span>
              {channels
                .filter((c) => c.type === 'direct')
                .map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between ${
                      activeChannel === ch.id
                        ? 'bg-[#17232D] border border-[#FFBF69]/50 text-[#F3F7FA] shadow-md'
                        : 'hover:bg-[#17232D]/40 text-[#8495A5] hover:text-[#F3F7FA]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <User className="w-3.5 h-3.5 text-[#FFBF69] shrink-0" />
                      <span className="text-xs font-bold font-display truncate">{ch.title}</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Status footer */}
        <div className="p-3 bg-[#080D12] border-t border-[#17232D] text-xs font-mono text-[#8495A5] flex items-center justify-between">
          <span>Signed in as:</span>
          <strong className="text-[#9FE870]">{userProfile.callsign}</strong>
        </div>
      </div>

      {/* 2. Message Thread Viewport */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#080D12]">
        {/* Active Channel Top Bar */}
        <div className="p-3.5 sm:p-4 bg-[#111922] border-b border-[#17232D] flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black font-display text-[#F3F7FA]">
                {currentChannelInfo.title}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#17232D] text-[#48DDF2] border border-[#48DDF2]/30">
                {currentChannelInfo.type.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-[#8495A5] mt-0.5">{currentChannelInfo.description}</p>
          </div>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-2 text-[#8495A5] hover:text-[#FF6464] hover:bg-[#17232D] rounded-xl transition-colors"
            title="Clear Chat Room"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Message Feed Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {channelMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#8495A5] space-y-3">
              <Radio className="w-10 h-10 text-[#48DDF2] opacity-40 animate-pulse" />
              <h4 className="text-base font-black font-display text-[#F3F7FA]">
                No messages yet in {currentChannelInfo.title}
              </h4>
              <p className="text-xs max-w-sm leading-relaxed">
                Send a tactical message or hold the mic button to transmit a voice note.
              </p>
            </div>
          ) : (
            channelMessages.map((msg) => {
              const isMine = msg.senderCallsign === userProfile.callsign;
              const isPending = msg.status === 'pending';
              const isEmergency = msg.isEmergency || msg.priority === 'urgent';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-xl rounded-2xl p-4 space-y-2 border transition-all shadow-md ${
                      isEmergency
                        ? 'bg-[#FF6464]/20 border-[#FF6464] text-[#F3F7FA]'
                        : isMine
                        ? 'bg-[#17232D] border-[#48DDF2]/40 text-[#F3F7FA]'
                        : 'bg-[#111922] border-[#17232D] text-[#F3F7FA]'
                    } ${isPending ? 'opacity-80 border-dashed border-[#FFBF69]/70' : ''}`}
                  >
                    {/* Header meta */}
                    <div className="flex items-center justify-between gap-4 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#48DDF2] text-sm font-display">
                          {msg.senderCallsign}
                        </span>
                        <span className="text-[#8495A5] text-[11px]">({msg.senderRole})</span>
                        {isEmergency && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#FF6464] text-[#080D12]">
                            SOS EMERGENCY
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-[#8495A5]">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Text Message Content */}
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap font-sans">
                      {msg.content}
                    </p>

                    {/* Audio Voice Note Player if Present */}
                    {msg.audioDataUrl && (
                      <div className="p-3 rounded-xl bg-[#080D12] border border-[#17232D] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => togglePlayAudio(msg.id, msg.audioDataUrl!)}
                            className="p-2.5 bg-[#48DDF2] text-[#080D12] rounded-xl font-bold hover:scale-105 transition-all shadow"
                          >
                            {playingAudioId === msg.id ? (
                              <Pause className="w-4 h-4 fill-current" />
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>
                          <div>
                            <span className="text-xs font-bold font-display text-[#F3F7FA] block">
                              Tactical Voice Note
                            </span>
                            <span className="text-[10px] font-mono text-[#8495A5]">
                              Duration: {Math.round(msg.audioDurationSec || 0)}s
                            </span>
                          </div>
                        </div>

                        <Volume2 className="w-5 h-5 text-[#48DDF2]" />
                      </div>
                    )}

                    {/* Delivery Status */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#17232D]/70 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5">
                        {isPending ? (
                          <span className="flex items-center gap-1 text-[#FFBF69] font-bold">
                            <RotateCw className="w-3 h-3 animate-spin" />
                            Pending Sync
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[#9FE870] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Delivered & Saved
                          </span>
                        )}
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => retryPendingMessage(msg.id)}
                            className="text-[#48DDF2] hover:underline font-bold"
                          >
                            Retry
                          </button>
                          <button
                            onClick={() => discardPendingMessage(msg.id)}
                            className="text-[#FF6464] hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message & Audio Composer */}
        <div className="p-3 sm:p-4 bg-[#111922] border-t border-[#17232D] space-y-3 shrink-0">
          {/* Priority selector */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-[#8495A5] font-semibold">Priority:</span>
              {(['normal', 'priority', 'urgent'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                    priority === p
                      ? p === 'urgent'
                        ? 'bg-[#FF6464] text-[#080D12]'
                        : p === 'priority'
                        ? 'bg-[#FFBF69] text-[#080D12]'
                        : 'bg-[#48DDF2] text-[#080D12]'
                      : 'bg-[#080D12] text-[#8495A5] hover:text-[#F3F7FA]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <span className="text-xs font-mono text-[#8495A5]">
              Sending as <strong className="text-[#9FE870]">{userProfile.callsign}</strong>
            </span>
          </div>

          {/* Active Voice Recording Bar */}
          {isRecording ? (
            <div className="p-3 rounded-2xl bg-[#FF6464]/20 border border-[#FF6464] flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#FF6464] animate-ping" />
                <span className="text-xs font-black font-display text-[#FF6464] uppercase tracking-wider">
                  Recording Voice Note... {recordSeconds}s
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRecording(false)}
                  className="px-3 py-1.5 text-xs text-[#8495A5] hover:text-[#F3F7FA]"
                >
                  Cancel
                </button>
                <button
                  onClick={stopAudioRecording}
                  className="px-4 py-1.5 bg-[#FF6464] hover:bg-[#ff4d4d] text-[#080D12] font-black font-display text-xs rounded-xl shadow"
                >
                  Transmit Voice Note
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Send message to ${currentChannelInfo.title}...`}
                className="flex-1 px-4 py-3 bg-[#080D12] border border-[#17232D] focus:border-[#48DDF2] rounded-xl text-xs sm:text-sm text-[#F3F7FA] outline-none shadow-inner"
              />

              {/* Record Audio Button */}
              <button
                type="button"
                onClick={startAudioRecording}
                className="p-3 bg-[#17232D] hover:bg-[#1f2f3d] text-[#48DDF2] rounded-xl transition-all border border-[#48DDF2]/30 active:scale-95"
                title="Record Audio Message"
              >
                <Mic className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-5 py-3 bg-[#48DDF2] hover:bg-[#48DDF2]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#080D12] font-black rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Confirmation Modal to Clear Chat */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#111922] border border-[#17232D] rounded-2xl p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-[#FF6464] flex items-center gap-2 font-display">
              <Trash2 className="w-4 h-4" />
              Clear messages in {currentChannelInfo.title}?
            </h4>
            <p className="text-xs text-[#8495A5] leading-relaxed">
              This will remove all saved messages for this chat channel from your local device.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs text-[#8495A5] hover:text-[#F3F7FA] bg-[#17232D] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowClearConfirm(false);
                  await clearConversation(activeChannel);
                }}
                className="px-4 py-1.5 text-xs font-black text-[#080D12] bg-[#FF6464] hover:bg-[#FF6464]/90 rounded-lg"
              >
                Clear Messages
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
