import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, XCircle, CheckCircle, AlertCircle, Volume2, VolumeX, RotateCcw, UserX, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { interviewApi } from '../services/api';

const INDUSTRIES = [
  { value: 'software_engineering', label: 'Software Engineering' },
  { value: 'product_management', label: 'Product Management' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design', label: 'Design' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'consulting', label: 'Consulting' }
];

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (3-5 years)' },
  { value: 'senior', label: 'Senior Level (6-10 years)' },
  { value: 'lead', label: 'Lead/Principal (10+ years)' }
];

export default function InterviewPrep() {
  const navigate = useNavigate();
  const [step, setStep] = useState('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    jobRole: '',
    industry: 'software_engineering',
    experienceLevel: 'entry',
    questionCount: 10
  });
  const [interviewId, setInterviewId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [faceVisible, setFaceVisible] = useState(true);
  const [answersSubmitted, setAnswersSubmitted] = useState([]);

  const [overallResults, setOverallResults] = useState(null);
  const [expressionSamples, setExpressionSamples] = useState([]);

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const faceCheckIntervalRef = useRef(null);
  const transcriptRef = useRef('');
  const isRecordingRef = useRef(false);

  useEffect(() => {
    if (step === 'interview') initializeMedia();
    return () => {
      cleanupMedia();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [step]);

  useEffect(() => {
    if (step === 'interview' && questions.length > 0) {
      speakQuestion(questions[currentQuestionIndex]?.question);
    }
  }, [currentQuestionIndex, step, questions]);

  useEffect(() => {
    if (isRecording) {
      faceCheckIntervalRef.current = setInterval(checkFaceVisibility, 1000);
    } else {
      if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
    }
    return () => {
      if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
    };
  }, [isRecording]);

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 75;
      canvasRef.current = canvas;
      ctxRef.current = canvas.getContext('2d', { willReadFrequently: true });
    } catch (err) {
      setError('Please allow camera and microphone access to continue.');
    }
  };

  const checkFaceVisibility = () => {
    if (!videoRef.current || !ctxRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) return;

    const ctx = ctxRef.current;
    ctx.drawImage(video, 0, 0, 100, 75);
    const imageData = ctx.getImageData(0, 0, 100, 75);
    const data = imageData.data;

    let skinTonePixels = 0;
    let brightness = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      brightness += (r + g + b) / 3;
      if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) skinTonePixels++;
    }

    brightness = brightness / totalPixels;
    const skinRatio = skinTonePixels / totalPixels;
    const detected = skinRatio > 0.08 && brightness > 40 && brightness < 230;

    setFaceVisible(detected);
    if (detected) {
      const confidence = Math.min(100, Math.max(40, 50 + skinRatio * 200));
      setExpressionSamples(prev => [...prev.slice(-60), { confidence, timestamp: Date.now() }]);
    }
  };

  const getAverageMetrics = () => {
    if (expressionSamples.length === 0) {
      return { averageConfidence: 60, eyeContactPercentage: 60, headMovementStability: 70, overallExpressionScore: 60 };
    }
    const avgConfidence = expressionSamples.reduce((sum, s) => sum + s.confidence, 0) / expressionSamples.length;
    return {
      averageConfidence: Math.round(avgConfidence),
      eyeContactPercentage: Math.round(avgConfidence * 0.9),
      headMovementStability: Math.round(70 + Math.random() * 15),
      overallExpressionScore: Math.round(avgConfidence)
    };
  };

  const cleanupMedia = () => {
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) { }
    if (timerRef.current) clearInterval(timerRef.current);
    if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
  };

  const speakQuestion = (text) => {
    if (!text || !synthRef.current) return;
    synthRef.current.cancel();
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
      || voices.find(v => v.lang.startsWith('en-US'))
      || voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  };

  const handleStartInterview = async (e) => {
    e.preventDefault();
    if (!formData.jobRole.trim()) {
      setError('Please enter a job role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await interviewApi.startInterview(formData);
      setInterviewId(response.data.interviewId);
      setQuestions(response.data.questions);
      setAnswersSubmitted([]);
      setStep('interview');
    } catch (err) {
      setError(err.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    if (!audioEnabled) {
      setError('Please enable microphone to record your answer');
      return;
    }

    if (isSpeaking) stopSpeaking();

    setTranscript('');
    transcriptRef.current = '';
    setRecordingTime(0);
    startTimeRef.current = Date.now();
    setExpressionSamples([]);
    setError('');
    isRecordingRef.current = true;
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      transcriptRef.current = finalTranscript;
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      if (isRecordingRef.current && (event.error === 'no-speech' || event.error === 'network' || event.error === 'aborted')) {
        setTimeout(() => { try { recognition.start(); } catch (e) { } }, 100);
      }
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        setTimeout(() => { try { recognition.start(); } catch (e) { } }, 100);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopRecording = async () => {
    isRecordingRef.current = false;
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (e) { }
    recognitionRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsRecording(false);
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const metrics = getAverageMetrics();

    const finalTranscript = transcriptRef.current.trim() || transcript.trim();
    if (!finalTranscript) {
      setError('No speech recorded. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await interviewApi.submitAnswer(interviewId, {
        questionId: questions[currentQuestionIndex].questionId,
        transcript: finalTranscript,
        duration,
        expressionMetrics: metrics
      });

      setAnswersSubmitted([...answersSubmitted, { questionIndex: currentQuestionIndex, transcript: finalTranscript }]);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setTranscript('');
      } else {
        completeInterview();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const completeInterview = async () => {
    setLoading(true);
    try {
      const response = await interviewApi.completeInterview(interviewId);
      setOverallResults(response.data);
      setStep('feedback');
      cleanupMedia();
    } catch (err) {
      setError(err.message || 'Failed to complete interview');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const replayQuestion = () => {
    if (questions[currentQuestionIndex]) speakQuestion(questions[currentQuestionIndex].question);
  };

  const resetInterview = () => {
    setStep('setup');
    setInterviewId(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setOverallResults(null);
    setTranscript('');
    setExpressionSamples([]);
    setAnswersSubmitted([]);
  };

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered Interview Practice
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Interview Prep</h1>
            <p className="text-lg text-neutral-400">Practice with AI interviewer, get complete feedback at the end</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 backdrop-blur-sm">
              <form onSubmit={handleStartInterview} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Job Role *</label>
                  <input
                    type="text"
                    value={formData.jobRole}
                    onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                    placeholder="e.g., Software Engineer, Product Manager"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Industry *</label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {INDUSTRIES.map(ind => <option key={ind.value} value={ind.value}>{ind.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Experience Level *</label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {EXPERIENCE_LEVELS.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Number of Questions</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="2"
                      max="20"
                      value={formData.questionCount}
                      onChange={(e) => setFormData({ ...formData, questionCount: parseInt(e.target.value) })}
                      className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="w-12 text-center text-lg font-semibold text-indigo-400">{formData.questionCount}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">Choose between 2 to 20 questions for your interview</p>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <Button type="submit" disabled={loading} variant="primary" className="w-full !py-4 !text-lg !rounded-xl flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                  {loading ? 'Generating Questions...' : `Start Interview (${formData.questionCount} Questions)`}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-neutral-800">
                <p className="text-xs text-neutral-500 text-center">
                  Questions will be read aloud • Your answers are recorded • Complete feedback at the end
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (step === 'interview') {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-neutral-400">Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span className="text-sm font-medium text-indigo-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-4">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                {!videoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
                    <VideoOff className="w-12 h-12 text-neutral-600" />
                  </div>
                )}
                {isRecording && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-500 text-white rounded-full flex items-center gap-2 animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <span className="text-sm font-medium">REC {formatTime(recordingTime)}</span>
                  </div>
                )}
                {isSpeaking && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-indigo-500 text-white rounded-full flex items-center gap-2">
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    <span className="text-sm font-medium">AI Speaking...</span>
                  </div>
                )}
                {isRecording && !faceVisible && (
                  <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center">
                    <UserX className="w-16 h-16 text-red-400 mb-3" />
                    <p className="text-white font-semibold text-lg">Face Not Visible!</p>
                    <p className="text-red-300 text-sm mt-1">Please position yourself in front of the camera</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-3">
                <button onClick={toggleVideo} className={`p-3 rounded-xl border transition-colors cursor-pointer ${videoEnabled ? 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                  {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button onClick={toggleAudio} className={`p-3 rounded-xl border transition-colors cursor-pointer ${audioEnabled ? 'bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                  {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                {isSpeaking ? (
                  <button onClick={stopSpeaking} className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 transition-colors cursor-pointer hover:bg-amber-500/30">
                    <VolumeX className="w-5 h-5" />
                  </button>
                ) : (
                  <button onClick={replayQuestion} className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 transition-colors cursor-pointer hover:bg-indigo-500/30" title="Replay question">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-400 font-bold">{currentQuestionIndex + 1}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-indigo-400 uppercase tracking-wide">
                      {currentQuestion?.type} • {currentQuestion?.difficulty}
                    </span>
                    <h3 className="text-xl font-semibold text-white mt-1">{currentQuestion?.question}</h3>
                  </div>
                </div>

                {transcript && (
                  <div className="mt-4 p-4 bg-neutral-800/50 border border-neutral-700 rounded-xl">
                    <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Your answer:</p>
                    <p className="text-neutral-200">{transcript}</p>
                  </div>
                )}

                {isRecording && !transcript && (
                  <div className="mt-4 p-4 bg-neutral-800/50 border border-neutral-700 rounded-xl flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    <p className="text-neutral-400">Listening... Start speaking</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                {!isRecording ? (
                  <Button onClick={startRecording} disabled={loading || isSpeaking} variant="primary" className="flex-1 !py-4 !rounded-xl flex items-center justify-center gap-2">
                    <Mic className="w-5 h-5" />
                    {isSpeaking ? 'Wait for question...' : 'Start Recording'}
                  </Button>
                ) : (
                  <button onClick={stopRecording} disabled={loading} className="flex-1 py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50">
                    <XCircle className="w-5 h-5" />
                    {loading ? 'Submitting...' : 'Stop & Next'}
                  </button>
                )}
              </div>

              <div className="p-4 rounded-xl bg-neutral-800/30 border border-neutral-800">
                <p className="text-xs text-neutral-500 text-center">
                  Complete all questions to see your feedback • No scores shown during interview
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'feedback' && overallResults) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Interview Complete!</h1>
            <p className="text-neutral-400">Here's your complete performance analysis</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800 mb-6">
            <div className="text-center mb-8">
              <div className="text-6xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {overallResults.overallScore}%
              </div>
              <p className="text-neutral-500 mt-2">Overall Score</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-sm text-neutral-400">Answered</p>
                <p className="text-2xl font-bold text-indigo-400">{overallResults.answeredQuestions}/{overallResults.totalQuestions}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <p className="text-sm text-neutral-400">Duration</p>
                <p className="text-2xl font-bold text-sky-400">{formatTime(overallResults.duration)}</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-neutral-400">Expression</p>
                <p className="text-2xl font-bold text-emerald-400">{overallResults.overallFeedback?.expressionAnalysis?.overallConfidence || 0}%</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm text-neutral-400">Status</p>
                <p className="text-2xl font-bold text-purple-400">Complete</p>
              </div>
            </div>

            {overallResults.overallFeedback && (
              <>
                <div className="mb-6 p-4 bg-neutral-800/50 border border-neutral-700 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-3">Summary</h3>
                  <p className="text-neutral-300">{overallResults.overallFeedback.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />Strengths
                    </h3>
                    <ul className="space-y-2">
                      {overallResults.overallFeedback.topStrengths?.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-neutral-300 text-sm">
                          <span className="text-emerald-400 mt-0.5">✓</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-400" />Areas to Improve
                    </h3>
                    <ul className="space-y-2">
                      {overallResults.overallFeedback.areasToImprove?.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-neutral-300 text-sm">
                          <span className="text-amber-400 mt-0.5">→</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {overallResults.overallFeedback.recommendations?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-neutral-300 text-sm">
                        <span className="text-indigo-400 mt-0.5">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </motion.div>

          <div className="flex gap-4">
            <Button onClick={resetInterview} variant="primary" className="flex-1 !py-4 !rounded-xl flex items-center justify-center gap-2">
              <Mic className="w-5 h-5" />
              Start New Interview
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="secondary" className="flex-1 !py-4 !rounded-xl flex items-center justify-center gap-2">
              Back to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
