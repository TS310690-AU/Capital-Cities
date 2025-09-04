import React, { useState, useEffect } from 'react';
import './App.css';

const TOTAL_QUESTIONS = 10;
const OPTIONS_COUNT = 4;

const App = () => {
  const [countries, setCountries] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [gameOver, setGameOver] = useState(false);

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/v3.1/all?fields=name,capital,flags');
        if (!response.ok) throw new Error('Error fetching countries');
        const data = await response.json();

        // Filter for countries with capital and flags
        const countriesWithCapitals = data.filter((c) =>
          c.flags?.svg && c.capital && c.capital.length > 0
        );
        setCountries(countriesWithCapitals);
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchCountries();
  }, []);

  // Generate questions when countries are loaded
  useEffect(() => {
    if (countries.length > 0) {
      generateNewGame();
    }
  }, [countries]);

  const generateNewGame = () => {
    const generateUniqueOptions = (correctCountry, allCountries) => {
      const correctCapital = Array.isArray(correctCountry.capital)
        ? correctCountry.capital[0]
        : correctCountry.capital;

      const incorrectCountries = allCountries.filter(
        (c) =>
          c.name.common !== correctCountry.name.common &&
          c.capital &&
          c.capital.length > 0
      );

      const incorrectOptions = incorrectCountries
        .sort(() => 0.5 - Math.random()) // Shuffle
        .slice(0, OPTIONS_COUNT - 1)
        .map((c) => (Array.isArray(c.capital) ? c.capital[0] : c.capital));

      const options = [correctCapital, ...incorrectOptions].sort(
        () => 0.5 - Math.random()
      );

      return options;
    };

    const shuffledCountries = [...countries].sort(() => 0.5 - Math.random());

    const questions = Array.from(
      { length: Math.min(TOTAL_QUESTIONS, shuffledCountries.length) },
      (_, idx) => {
        const correctCountry = shuffledCountries[idx];

        return {
          id: idx + 1,
          flag: correctCountry.flags.svg,
          correctAnswer: Array.isArray(correctCountry.capital)
            ? correctCountry.capital[0]
            : correctCountry.capital,
          countryName: correctCountry.name.common,
          options: generateUniqueOptions(correctCountry, countries),
        };
      }
    );

    setQuizQuestions(questions);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setFeedback('');
    setGameOver(false);
  };

  const handleAnswer = (answer) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);

    if (quizQuestions[currentQuestion].correctAnswer === answer) {
      setScore(score + 1);
      setFeedback(
        `Correct! ${answer} is the capital of ${quizQuestions[currentQuestion].countryName}.`
      );
    } else {
      setFeedback(
        `Incorrect. The correct answer was ${quizQuestions[currentQuestion].correctAnswer} for ${quizQuestions[currentQuestion].countryName}.`
      );
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setFeedback('');
    if (currentQuestion + 1 < quizQuestions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setGameOver(true);
    }
  };

  if (gameOver) {
    return (
      <div className="App">
        <h1>Quiz Completed!</h1>
        <p>
          Final Score: {score} / {quizQuestions.length}
        </p>
        <button onClick={generateNewGame}>Play Again</button>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Select the capital city of the country/territory with this flag</h1>
      {quizQuestions.length > 0 && (
        <>
          <p>
            Question {currentQuestion + 1} of {quizQuestions.length}
          </p>
          <img
            key={quizQuestions[currentQuestion].flag}
            src={quizQuestions[currentQuestion].flag}
            alt={`Flag of ${quizQuestions[currentQuestion].countryName}`}
            style={{ width: '200px', height: 'auto', objectFit: 'contain' }}
            loading="lazy"
            width="200"
            height="auto"
          />
          <div className="options">
            {quizQuestions[currentQuestion].options.map((option) => (
              <button
                key={option}
                className={`option ${
                  selectedAnswer === option
                    ? option === quizQuestions[currentQuestion].correctAnswer
                      ? 'correct'
                      : 'incorrect'
                    : ''
                }`}
                onClick={() => handleAnswer(option)}
                disabled={selectedAnswer !== null}
              >
                {option}
              </button>
            ))}
          </div>
          {feedback && <p className="feedback">{feedback}</p>}
          {selectedAnswer && (
            <button onClick={nextQuestion} className="next-button">
              Next Question
            </button>
          )}
          <p className="score">Score: {score}</p>
        </>
      )}
    </div>
  );
};

export default App;