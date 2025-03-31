'use client';

import { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, ChartData, registerables } from 'chart.js';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
} from '@/components/ui';
import { motion } from 'framer-motion';
import {
  enhanceComposition,
  type AICompositionResult,
} from '@/lib/ai-composer';
import { saveAs } from 'file-saver';
import { PiCanvasRef } from '../../components/PiCanvas';
import MidiWriter from 'midi-writer-js';

Chart.register(...registerables);

// Update the scales definition at the top of the file
const scales: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
};

const keys: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const noteNames = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

// Add this utility function for Pi calculation outside the component
// Using the Nilakantha series for better precision
const calculatePiDigits = (digits: number): string => {
  // For small number of digits, use built-in Math.PI
  if (digits <= 15) {
    return Math.PI.toString().slice(0, digits + 2); // +2 for "3."
  }

  // For larger numbers, use a more precise algorithm
  let i = 1n;
  let x = 3n * 10n ** BigInt(digits + 20);
  let pi = x;
  while (x > 0) {
    x = (x * i) / ((i + 1n) * 4n);
    pi += x / (i + 2n);
    i += 2n;
  }
  return (pi / 10n ** BigInt(20)).toString().slice(0, digits + 2);
};

const MAX_PI_DIGITS = 100;

const PiComposer = () => {
  const [numDigits, setNumDigits] = useState(20); // Reduced default for better performance
  const [scale, setScale] = useState<'major' | 'minor'>('major');
  const [key, setKey] = useState<string>('D');
  const [tempo, setTempo] = useState(120);
  const [notes, setNotes] = useState<string[]>([]);
  const [playing, setPlaying] = useState(false);
  const [waveform, setWaveform] = useState<OscillatorType>('sine');
  const [currentNoteIndex, setCurrentNoteIndex] = useState(-1);
  const playingRef = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);
  const [piDigits, setPiDigits] = useState<string>('');

  // AI enhancement options
  const [useAI, setUseAI] = useState(false);
  const [complexity, setComplexity] = useState(0.5);
  const [variation, setVariation] = useState(0.3);
  const [useHarmony, setUseHarmony] = useState(false);
  const [aiResult, setAiResult] = useState<AICompositionResult | null>(null);
  const [activeHarmony, setActiveHarmony] = useState<number | null>(null);
  const piCanvasRef = useRef<PiCanvasRef>(null);

  // Add this function to export MIDI
  const exportMidi = () => {
    // Create a new track
    const track = new MidiWriter.Track();

    // Define the tempo
    track.setTempo(tempo);

    // Get the notes to export - use the same notes that are being played
    const notesToExport = notes;
    const harmonies = aiResult?.harmonies || [];

    // Add notes to the track with proper timing
    notesToExport.forEach((note, index) => {
      const noteName = note.slice(0, -1);
      const octave = parseInt(note.slice(-1));

      // Convert note name to MIDI note number
      const noteMap: Record<string, number> = {
        C: 0,
        'C#': 1,
        D: 2,
        'D#': 3,
        E: 4,
        F: 5,
        'F#': 6,
        G: 7,
        'G#': 8,
        A: 9,
        'A#': 10,
        B: 11,
      };

      const midiNote = (octave + 1) * 12 + noteMap[noteName];

      // Add note event (quarter note duration)
      track.addEvent(
        new MidiWriter.NoteEvent({
          pitch: [midiNote],
          duration: '4',
          velocity: 100,
        })
      );

      // Add harmony notes if active
      if (
        activeHarmony !== null &&
        harmonies[activeHarmony] &&
        harmonies[activeHarmony][index]
      ) {
        const harmonyNote = harmonies[activeHarmony][index];
        const harmonyNoteName = harmonyNote.slice(0, -1);
        const harmonyOctave = parseInt(harmonyNote.slice(-1));
        const harmonyMidiNote =
          (harmonyOctave + 1) * 12 + noteMap[harmonyNoteName];

        // Add harmony note with slight delay for arpeggio effect
        track.addEvent(
          new MidiWriter.NoteEvent({
            pitch: [harmonyMidiNote],
            duration: '4',
            velocity: 90, // Slightly quieter than the main note
            sequential: true, // This makes it play after the previous note
          })
        );
      }
    });

    // Generate the MIDI file
    const write = new MidiWriter.Writer([track]);

    // Create a Blob and save it
    const midiBlob = new Blob([write.buildFile()], {
      type: 'audio/midi',
    });

    saveAs(
      midiBlob,
      `pi-loom-composition-${new Date().toISOString().slice(0, 10)}.mid`
    );
  };

  console.log({ numDigits, piDigits });
  console.log({ numDigits, piDigits });
  const generateMusicFromPi = () => {
    // Use our custom Pi calculation function
    const fullPiStr = calculatePiDigits(numDigits);
    setPiDigits(fullPiStr);

    // Remove decimal point for note generation
    const piStr = fullPiStr.replace('.', '').slice(1, numDigits + 1);
    const generatedNotes: string[] = [];

    if (!(scale in scales) || !(key in keys)) {
      alert('Invalid scale or key.');
      return;
    }

    const scalePattern = scales[scale];
    const keyOffset = keys[key];

    for (const digit of piStr) {
      const digitInt = parseInt(digit);
      const noteIndex = digitInt % scalePattern.length;
      const noteValue = scalePattern[noteIndex];
      const pitch = keyOffset + noteValue;
      const octave = 4 + Math.floor(digitInt / scalePattern.length);
      const noteName = noteNames[pitch % 12] + octave;
      generatedNotes.push(noteName);
    }

    setNotes(generatedNotes);

    // Apply AI enhancement if enabled
    if (useAI) {
      applyAIEnhancement(generatedNotes);
    } else {
      setAiResult(null);
    }
  };

  const applyAIEnhancement = (originalNotes: string[]) => {
    // Stop playback if it's currently playing
    if (playing) {
      stopMusic();
    }

    const result = enhanceComposition({
      notes: originalNotes,
      complexity,
      harmony: useHarmony,
      variation,
    });

    setAiResult(result);
    setNotes(result.enhancedNotes);

    // Reset current note index to ensure UI is in sync
    setCurrentNoteIndex(-1);
  };

  useEffect(() => {
    generateMusicFromPi();
    audioContext.current = new AudioContext();

    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    generateMusicFromPi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numDigits, scale, key, useAI, complexity, variation, useHarmony, tempo]);

  const getFrequency = (noteName: string) => {
    const octave = parseInt(noteName.slice(-1));
    const noteIndex = noteNames.indexOf(noteName.slice(0, -1));
    return 440 * Math.pow(2, (noteIndex - 9) / 12 + (octave - 4));
  };

  const playNote = (noteName: string, startTime: number) => {
    if (!audioContext.current) return;
    const frequency = getFrequency(noteName);

    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gainNode.gain.setValueAtTime(0.5, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.5);

    // Pulse the Pi symbol when the note starts playing
    if (startTime === audioContext.current.currentTime) {
      piCanvasRef.current?.pulseEffect();
    }
  };

  const playMusic = async () => {
    if (playing || !audioContext.current) return;
    setPlaying(true);
    playingRef.current = true;

    if (audioContext.current.state === 'suspended') {
      await audioContext.current.resume();
    }

    const secondsPerBeat = 60 / tempo;
    const currentTime = audioContext.current.currentTime;

    const notesToPlay = notes;
    const harmonies = aiResult?.harmonies || [];

    for (let i = 0; i < notesToPlay.length; i++) {
      if (!playingRef.current) break;
      setCurrentNoteIndex(i);

      // Play the main note
      playNote(notesToPlay[i], currentTime + i * secondsPerBeat);

      // Play harmony notes if active
      if (
        activeHarmony !== null &&
        harmonies[activeHarmony] &&
        harmonies[activeHarmony][i]
      ) {
        // Play with slight delay for arpeggio effect
        playNote(
          harmonies[activeHarmony][i],
          currentTime + i * secondsPerBeat + 0.05
        );
      }

      await new Promise((resolve) =>
        setTimeout(resolve, secondsPerBeat * 1000)
      );
    }

    setPlaying(false);
    playingRef.current = false;
    setCurrentNoteIndex(-1);
  };

  const stopMusic = () => {
    setPlaying(false);
    playingRef.current = false;
    setCurrentNoteIndex(-1);
  };

  const chartData: ChartData = {
    labels: notes.map((_, i) => i + 1),
    datasets: [
      {
        label: 'Note Frequencies (Hz)',
        data: notes.map(getFrequency),
        borderColor: 'var(--chart-1)',
        backgroundColor: 'var(--chart-1)',
        fill: false,
        pointBackgroundColor: (ctx: { dataIndex: number }) =>
          ctx.dataIndex === currentNoteIndex
            ? 'var(--destructive)'
            : 'var(--chart-1)',
        pointRadius: (ctx: { dataIndex: number }) =>
          ctx.dataIndex === currentNoteIndex ? 8 : 4,
      },
      ...(aiResult?.patterns?.map((pattern, idx) => ({
        label: `Pattern ${idx + 1}`,
        data: Array(notes.length)
          .fill(null)
          .map((_, i) => {
            // Highlight the pattern occurrences
            const isInPattern =
              pattern.start <= i && i < pattern.start + pattern.length;
            return isInPattern ? getFrequency(notes[i]) : null;
          }),
        borderColor: `var(--chart-${(idx % 4) + 2})`,
        backgroundColor: `var(--chart-${(idx % 4) + 2})`,
        pointRadius: 6,
        showLine: false,
      })) || []),
    ],
  };

  // Enhance the renderPiDigits function
  const renderPiDigits = () => {
    if (!piDigits) return null;

    return (
      <div className="pi-visualization font-mono text-sm overflow-x-auto whitespace-nowrap pb-2 max-h-32 overflow-y-auto">
        <div className="grid grid-cols-10 gap-1">
          {piDigits.split('').map((digit, index) => {
            const isCurrentDigit = index === currentNoteIndex + 2; // +2 to account for "3."
            const isDecimalPoint = digit === '.';
            const noteIndex = index - 2; // Adjust for "3."
            const note =
              noteIndex >= 0 && noteIndex < notes.length
                ? notes[noteIndex]
                : null;

            return (
              <div
                key={index}
                className={`relative flex flex-col items-center justify-center p-1 rounded-md ${
                  isCurrentDigit
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                } ${isDecimalPoint ? 'text-primary font-bold' : ''}`}
              >
                <span className="text-lg">{digit}</span>
                {note && <span className="text-xs opacity-70">{note}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 border-r p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Pi Loom</h1>
          <p className="text-sm text-muted-foreground">
            AI Music Composer based on π
          </p>
          <div className="mt-6 space-y-4">
            <h2 className="text-lg font-medium mb-2">Export</h2>
            <Button onClick={exportMidi} className="w-full" variant="outline">
              Export as MIDI
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-2">Composition Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Number of Digits
                </label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[numDigits]}
                    min={10}
                    max={MAX_PI_DIGITS}
                    step={10}
                    onValueChange={(value) => setNumDigits(value[0])}
                  />
                  <span className="w-12 text-center">{numDigits}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Using {numDigits > 15 ? 'custom algorithm' : 'Math.PI'} for
                  calculation
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Key</label>
                <Select value={key} onValueChange={(value) => setKey(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select key" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(keys).map((k) => (
                      <SelectItem key={k} value={k}>
                        {k}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Scale</label>
                <Select
                  value={scale}
                  onValueChange={(value) =>
                    setScale(value as 'major' | 'minor')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scale" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tempo (BPM)
                </label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[tempo]}
                    min={40}
                    max={240}
                    step={5}
                    onValueChange={(value) => setTempo(value[0])}
                  />
                  <span className="w-12 text-center">{tempo}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Waveform
                </label>
                <Select
                  value={waveform}
                  onValueChange={(value) =>
                    setWaveform(value as OscillatorType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select wave form" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sine">Sine</SelectItem>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="sawtooth">Sawtooth</SelectItem>
                    <SelectItem value="triangle">Triangle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-2">AI Enhancement</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch checked={useAI} onCheckedChange={setUseAI} />
                <label className="text-sm font-medium">
                  Enable AI Enhancement
                </label>
              </div>

              {useAI && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Complexity
                    </label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[complexity]}
                        min={0}
                        max={1}
                        step={0.1}
                        onValueChange={(value) => setComplexity(value[0])}
                      />
                      <span className="w-12 text-center">
                        {complexity.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Variation
                    </label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[variation]}
                        min={0}
                        max={1}
                        step={0.1}
                        onValueChange={(value) => setVariation(value[0])}
                      />
                      <span className="w-12 text-center">
                        {variation.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={useHarmony}
                      onCheckedChange={setUseHarmony}
                    />
                    <label className="text-sm font-medium">
                      Enable Harmonies
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">π Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            {renderPiDigits()}
            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                The highlighted digit is currently playing. Each digit of π is
                mapped to a musical note.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Playback Controls</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <motion.div
                animate={{ scale: playing ? 1.1 : 1 }}
                transition={{
                  duration: 0.5,
                  repeat: playing ? Infinity : 0,
                  repeatType: 'reverse',
                }}
                className="mb-6"
              >
                <Button
                  size="lg"
                  onClick={playing ? stopMusic : playMusic}
                  className="w-24 h-24 rounded-full text-xl"
                >
                  {playing ? 'Stop' : 'Play'}
                </Button>
              </motion.div>

              <div className="w-full">
                <Slider
                  value={[currentNoteIndex >= 0 ? currentNoteIndex : 0]}
                  max={notes.length - 1}
                  disabled={!playing}
                  className="mt-4"
                />
                <div className="text-center mt-2">
                  {currentNoteIndex >= 0
                    ? `Note ${currentNoteIndex + 1}: ${notes[currentNoteIndex]}`
                    : 'Not playing'}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Note Information</CardTitle>
            </CardHeader>
            <CardContent>
              {currentNoteIndex >= 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium">π Digit:</div>
                    <div>{piDigits[currentNoteIndex + 2] || '-'}</div>

                    <div className="text-sm font-medium">Note:</div>
                    <div>{notes[currentNoteIndex] || '-'}</div>

                    <div className="text-sm font-medium">Frequency:</div>
                    <div>
                      {notes[currentNoteIndex]
                        ? `${getFrequency(notes[currentNoteIndex]).toFixed(
                            2
                          )} Hz`
                        : '-'}
                    </div>

                    <div className="text-sm font-medium">Position:</div>
                    <div>
                      {currentNoteIndex + 1} of {notes.length}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Press Play to start the composition
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Note Frequency Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '300px' }}>
              <Line
                data={chartData as ChartData<'line'>}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      title: {
                        display: true,
                        text: 'Frequency (Hz)',
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'π Digit Position',
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {useAI && aiResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>AI-Detected Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiResult.patterns.length > 0 ? (
                  <>
                    <p>
                      The AI has detected the following patterns in π&apos;s
                      digits:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiResult.patterns.map((pattern, idx) => (
                        <div key={idx} className="border rounded-md p-3">
                          <div className="font-medium">Pattern {idx + 1}</div>
                          <div className="text-sm text-muted-foreground">
                            Position: {pattern.start + 1} to{' '}
                            {pattern.start + pattern.length}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Length: {pattern.length} notes
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Repeats: {pattern.repeats} times
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Significance:{' '}
                            {(pattern.significance * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p>
                    No significant patterns detected in the current sequence.
                  </p>
                )}

                {aiResult.harmonies && aiResult.harmonies.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-medium mb-2">
                      Harmony Controls
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={activeHarmony === null ? 'default' : 'outline'}
                        onClick={() => setActiveHarmony(null)}
                      >
                        Melody Only
                      </Button>
                      <Button
                        variant={activeHarmony === 0 ? 'default' : 'outline'}
                        onClick={() => setActiveHarmony(0)}
                      >
                        Third Harmony
                      </Button>
                      <Button
                        variant={activeHarmony === 1 ? 'default' : 'outline'}
                        onClick={() => setActiveHarmony(1)}
                      >
                        Fifth Harmony
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Generated Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto">
              <p className="font-mono text-sm">{notes.join(' ')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PiComposer;
