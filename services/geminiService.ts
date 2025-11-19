import { Shape, Inputs, ValidationResult } from '../types';

// Toleransi perbedaan ukuran (misal: koma atau ketidakakuratan pengukuran kecil)
const TOLERANCE = 0.2;

const isApproximatelyEqual = (n1: number, n2: number) => Math.abs(n1 - n2) < TOLERANCE;

export const validateShape = async (shape: Shape, inputs: Inputs): Promise<ValidationResult> => {
  // Simulasi delay agar UX terasa seperti sedang "memikirkan/menghitung"
  await new Promise(resolve => setTimeout(resolve, 800));

  const vals = Object.entries(inputs).reduce((acc, [key, value]) => {
    acc[key] = parseFloat(value);
    return acc;
  }, {} as Record<string, number>);

  let isValid = false;
  let explanation = '';
  let keliling = 0;

  try {
    switch (shape) {
      case Shape.Square: {
        const sides = [vals.sisi1, vals.sisi2, vals.sisi3, vals.sisi4];
        const avg = sides.reduce((a, b) => a + b, 0) / 4;
        
        // Cek apakah semua sisi dekat dengan rata-rata (artinya semua sisi sama)
        isValid = sides.every(s => isApproximatelyEqual(s, avg));
        
        if (isValid) {
          keliling = sides.reduce((a, b) => a + b, 0);
          explanation = "Mantap, Anda dapat proyek! Keempat sisi persegi memiliki panjang yang sama.";
        } else {
          explanation = "Ukuran tidak valid untuk Persegi. Semua sisi harus memiliki panjang yang sama.";
        }
        break;
      }

      case Shape.Rectangle: {
        const sides = [vals.sisi1, vals.sisi2, vals.sisi3, vals.sisi4].sort((a, b) => a - b);
        // Setelah diurutkan: sides[0] & sides[1] adalah sisi pendek, sides[2] & sides[3] adalah sisi panjang
        
        const shortSidesEqual = isApproximatelyEqual(sides[0], sides[1]);
        const longSidesEqual = isApproximatelyEqual(sides[2], sides[3]);
        
        isValid = shortSidesEqual && longSidesEqual;

        if (isValid) {
          keliling = sides.reduce((a, b) => a + b, 0);
          explanation = "Mantap, Anda dapat proyek! Sisi yang berhadapan memiliki panjang yang sama.";
        } else {
          explanation = "Ukuran tidak valid untuk Persegi Panjang. Dua pasang sisi yang berhadapan harus sama panjang.";
        }
        break;
      }

      case Shape.RightTriangle: {
        const { a, b, c } = vals;
        // a = alas, b = tinggi, c = miring
        // Cek Pythagoras: a^2 + b^2 = c^2
        
        const pythagoras = (a * a) + (b * b);
        const hypotenuseSquared = c * c;

        // Toleransi sedikit lebih besar untuk kuadrat
        isValid = Math.abs(pythagoras - hypotenuseSquared) < (TOLERANCE * 5); 

        if (isValid) {
          keliling = a + b + c;
          explanation = "Mantap, Anda dapat proyek! Ukuran memenuhi teorema Pythagoras untuk segitiga siku-siku.";
        } else {
          explanation = `Ukuran tidak valid. ${a}² + ${b}² (${pythagoras.toFixed(2)}) tidak sama dengan ${c}² (${hypotenuseSquared.toFixed(2)}). Pastikan sisi miring sudah benar.`;
        }
        break;
      }

      case Shape.RightTrapezoid: {
        const { atas, bawah, tinggi, miring } = vals;
        
        // Jika atas == bawah, itu persegi panjang, bukan trapesium siku-siku standar
        if (isApproximatelyEqual(atas, bawah)) {
            isValid = false;
            explanation = "Ukuran tidak valid untuk Trapesium Siku-Siku. Sisi atas dan bawah tidak boleh sama panjang (itu adalah Persegi Panjang).";
            break;
        }

        // Trapesium siku-siku valid jika selisih sisi sejajar (alas segitiga imajiner) 
        // dan tinggi membentuk pythagoras dengan sisi miring.
        const alasSegitiga = Math.abs(bawah - atas);
        const pythagoras = (alasSegitiga * alasSegitiga) + (tinggi * tinggi);
        const miringSquared = miring * miring;

        isValid = Math.abs(pythagoras - miringSquared) < (TOLERANCE * 5);

        if (isValid) {
          keliling = atas + bawah + tinggi + miring;
          explanation = "Mantap, Anda dapat proyek! Hubungan antara tinggi, selisih sisi sejajar, dan sisi miring sudah tepat.";
        } else {
          explanation = `Ukuran tidak valid. Sisi miring (${miring}) tidak sesuai dengan perhitungan Pythagoras. Seharusnya mendekati ${Math.sqrt(pythagoras).toFixed(2)}.`;
        }
        break;
      }
      
      default:
        explanation = "Bangun ruang tidak dikenal.";
    }
  } catch (error) {
    console.error(error);
    throw new Error("Terjadi kesalahan saat menghitung validasi.");
  }

  // Jika valid tetapi keliling 0 atau negatif, set invalid
  if (isValid && keliling <= 0) {
      isValid = false;
      explanation = "Terjadi kesalahan perhitungan, keliling tidak valid.";
  }

  // Jika tidak valid, pastikan keliling 0
  if (!isValid) {
    keliling = 0;
  }

  return {
    isValid,
    explanation,
    keliling
  };
};