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

  // Skip if we don't have enough notes to find patterns
  if (notes.length < 10) {
    return patterns;
  }

  // For various pattern lengths - start with smaller patterns which are more likely to repeat
  for (let length = 2; length <= 5; length++) {
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
    for (const [, positions] of patternMap.entries()) {
      // We need at least 2 occurrences to have a repeating pattern
      if (positions.length >= 2) {
        // Calculate significance based on pattern length and number of repetitions
        const significance = Math.min(1, (positions.length * length) / 20);

        patterns.push({
          start: positions[0],
          length,
          repeats: positions.length,
          significance,
        });
      }
    }
  }

  // If we still don't have patterns, create some artificial ones
  // This ensures the AI enhancement still has something to work with
  if (patterns.length === 0 && notes.length >= 10) {
    // Find sections with similar notes (not exact matches)
    for (let i = 0; i < notes.length - 5; i++) {
      const section = notes.slice(i, i + 3);
      let repeats = 0;

      // Look for similar sections (containing at least one matching note)
      for (let j = i + 3; j < notes.length - 2; j++) {
        const compareSection = notes.slice(j, j + 3);
        if (section.some((note) => compareSection.includes(note))) {
          repeats++;
        }
      }

      if (repeats >= 2) {
        patterns.push({
          start: i,
          length: 3,
          repeats: repeats + 1, // +1 to count the original occurrence
          significance: Math.min(1, (repeats * 3) / 20),
        });

        // Skip ahead to avoid overlapping patterns
        i += 2;
      }
    }
  }

  // Sort by significance and take the top 5
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
    // Probability of applying enhancement increases with variation level
    if (Math.random() < variation * 0.8) {
      const patternNotes = notes.slice(
        pattern.start,
        pattern.start + pattern.length
      );

      // Apply different enhancements based on pattern significance
      if (pattern.significance > 0.7) {
        // For highly significant patterns, emphasize by repeating
        const insertPosition = Math.floor(
          Math.random() * (notes.length - pattern.length)
        );
        enhancedNotes.splice(insertPosition, 0, ...patternNotes);
      } else if (pattern.significance > 0.4) {
        // For medium significance, modify slightly
        for (let i = 0; i < pattern.repeats; i++) {
          const pos = pattern.start + i * pattern.length;
          if (pos < enhancedNotes.length && Math.random() < variation) {
            // Emphasize by raising octave
            const note = enhancedNotes[pos];
            const noteName = note.slice(0, -1);
            const octave = parseInt(note.slice(-1));
            enhancedNotes[pos] = `${noteName}${Math.min(octave + 1, 7)}`;
          }
        }
      } else {
        // For lower significance patterns, add subtle variations
        for (let i = 0; i < pattern.length; i++) {
          if (Math.random() < variation * 0.3) {
            const pos = pattern.start + i;
            if (pos < enhancedNotes.length) {
              // Add slight emphasis by adjusting note duration (handled in playback)
              // Mark this by adding an asterisk that will be removed before playback
              enhancedNotes[pos] = enhancedNotes[pos] + '*';
            }
          }
        }
      }
    }
  }

  // Clean up any special markers before returning
  return enhancedNotes.map((note) => note.replace('*', ''));
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
  // Complexity affects how many patterns we use
  const patternsToUse =
    complexity > 0
      ? patterns.slice(0, Math.max(1, Math.floor(patterns.length * complexity)))
      : [];

  const enhancedNotes =
    complexity > 0 ? enhanceMelody(notes, patternsToUse, variation) : notes;

  return {
    enhancedNotes,
    patterns,
    harmonies,
  };
}
