// AI-based pattern recognition and melody enhancement
export interface AICompositionOptions {
  notes: string[];
  complexity: number; // 0-1 scale
  harmony: boolean;
  variation: number; // 0-1 scale
}

export interface AICompositionResult {
  enhancedNotes: string[];
  patterns: Pattern[];
  harmonies?: string[][];
}

interface Pattern {
  start: number;
  length: number;
  repeats: number;
  significance: number; // 0-1 scale
}

// Detect repeating patterns in the π-generated melody
function detectPatterns(notes: string[]): Pattern[] {
  const patterns: Pattern[] = [];

  // For various pattern lengths
  for (let length = 3; length <= 8; length++) {
    const patternMap = new Map<string, number[]>();

    // Slide through the notes array
    for (let i = 0; i <= notes.length - length; i++) {
      const pattern = notes.slice(i, i + length).join(',');

      if (!patternMap.has(pattern)) {
        patternMap.set(pattern, []);
      }

      patternMap.get(pattern)?.push(i);
    }

    // Find patterns that repeat
    for (const [pattern, positions] of patternMap.entries()) {
      if (positions.length > 1) {
        patterns.push({
          start: positions[0],
          length,
          repeats: positions.length,
          significance: Math.min(1, (positions.length * length) / 50),
        });
      }
    }
  }

  // Sort by significance
  return patterns.sort((a, b) => b.significance - a.significance).slice(0, 5);
}

// Generate harmonies based on the original melody
function generateHarmonies(notes: string[]): string[][] {
  const harmonies: string[][] = [];

  // Simple third harmony (add a note a third above in the scale)
  const thirdHarmony = notes.map((note) => {
    const noteName = note.slice(0, -1);
    const octave = parseInt(note.slice(-1));

    // This is a simplified approach - in a real app, you'd use music theory
    // to determine the correct third based on the scale
    const noteIndex = [
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
    ].indexOf(noteName);
    const thirdIndex = (noteIndex + 4) % 12; // Perfect third
    const thirdName = [
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
    ][thirdIndex];

    return `${thirdName}${octave}`;
  });

  // Simple fifth harmony
  const fifthHarmony = notes.map((note) => {
    const noteName = note.slice(0, -1);
    const octave = parseInt(note.slice(-1));

    const noteIndex = [
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
    ].indexOf(noteName);
    const fifthIndex = (noteIndex + 7) % 12; // Perfect fifth
    const fifthName = [
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
    ][fifthIndex];

    return `${fifthName}${octave}`;
  });

  harmonies.push(thirdHarmony);
  harmonies.push(fifthHarmony);

  return harmonies;
}

// Enhance the melody based on detected patterns
function enhanceMelody(
  notes: string[],
  patterns: Pattern[],
  variation: number
): string[] {
  if (variation === 0) return notes;

  const enhancedNotes = [...notes];

  // Apply variations based on the most significant patterns
  for (const pattern of patterns) {
    if (Math.random() > 0.5) {
      // Randomly choose to enhance this pattern
      const patternNotes = notes.slice(
        pattern.start,
        pattern.start + pattern.length
      );

      // Apply different enhancements based on pattern significance
      if (pattern.significance > 0.7 && Math.random() < variation) {
        // For highly significant patterns, emphasize by repeating
        const insertPosition = Math.floor(
          Math.random() * (notes.length - pattern.length)
        );
        enhancedNotes.splice(insertPosition, 0, ...patternNotes);
      } else if (pattern.significance > 0.4 && Math.random() < variation) {
        // For medium significance, modify slightly
        for (let i = 0; i < pattern.repeats; i++) {
          const pos = pattern.start + i * pattern.length;
          if (pos < enhancedNotes.length && Math.random() < variation) {
            // Emphasize by raising octave
            const note = enhancedNotes[pos];
            const noteName = note.slice(0, -1);
            const octave = parseInt(note.slice(-1));
            enhancedNotes[pos] = `${noteName}${octave + 1}`;
          }
        }
      }
    }
  }

  return enhancedNotes;
}

export function enhanceComposition(
  options: AICompositionOptions
): AICompositionResult {
  const { notes, complexity, harmony, variation } = options;

  // Detect patterns in the original melody
  const patterns = detectPatterns(notes);

  // Generate harmonies if requested
  const harmonies = harmony ? generateHarmonies(notes) : undefined;

  // Enhance the melody based on complexity and variation
  const enhancedNotes =
    complexity > 0 ? enhanceMelody(notes, patterns, variation) : notes;

  return {
    enhancedNotes,
    patterns,
    harmonies,
  };
}
