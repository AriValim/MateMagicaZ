// =============== CONSTANTES E VARIÁVEIS GLOBAIS ===============

// Elementos DOM - Armazenados em cache para melhorar performance
const welcomeScreen = document.getElementById("welcome-screen");
const gameScreen = document.getElementById("game-screen");
const resultsScreen = document.getElementById("results-screen");
const playersContainer = document.getElementById("players-container");
const addPlayerBtn = document.getElementById("add-player");
const startGameBtn = document.getElementById("start-game");
const difficultySelect = document.getElementById("difficulty");
const numQuestionsInput = document.getElementById("num-questions");
const currentPlayerDisplay = document.getElementById("current-player");
const questionCounterDisplay = document.getElementById("question-counter");
const scoreDisplay = document.getElementById("score-display");
const timeLeftDisplay = document.getElementById("time-left");
const questionDisplay = document.getElementById("question");
const answerInput = document.getElementById("answer-input");
const submitAnswerBtn = document.getElementById("submit-answer");
const feedbackDisplay = document.getElementById("feedback");
const playerResultsContainer = document.getElementById("player-results");
const totalCorrectDisplay = document.getElementById("total-correct");
const accuracyDisplay = document.getElementById("accuracy");
const avgTimeDisplay = document.getElementById("avg-time");
const playAgainBtn = document.getElementById("play-again");
const returnHomeBtn = document.getElementById("return-home");
const operationCheckboxes = {
  addition: document.getElementById("addition"),
  subtraction: document.getElementById("subtraction"),
  multiplication: document.getElementById("multiplication"),
  division: document.getElementById("division"),
};
const operationIcons = document.querySelectorAll(".operation-icon");

// Sons
const correctSound = document.getElementById("correct-sound");
const wrongSound = document.getElementById("wrong-sound");
const winSound = document.getElementById("win-sound");

// Variáveis do jogo
let players = []; // Array para armazenar os jogadores
let currentPlayerIndex = 0; // Índice do jogador atual
let currentQuestion = 0; // Número da questão atual
let totalQuestions = 10; // Total de questões
let gameTimer = null; // Timer para contagem regressiva
let timeRemaining = 30; // Tempo para responder (em segundos)
let difficulty = "facil"; // Nível de dificuldade
let correctAnswer = null; // Resposta correta da questão atual
let currentOperation = ""; // Operação atual (adição, subtração, etc.)
let gameStats = {
  totalCorrect: 0,
  totalQuestions: 0,
  totalTime: 0,
}; // Estatísticas do jogo
let lastTimerUpdate = 0; // Timestamp da última atualização do timer
let isProcessingAnswer = false; // Flag para evitar múltiplas submissões

// Cache para operações de mapeamento (melhora performance)
const operationMapping = {
  "+": "addition",
  "-": "subtraction",
  "×": "multiplication",
  "÷": "division",
};

// =============== FUNÇÕES DE INICIALIZAÇÃO ===============

/**
 * Inicializa os eventos do jogo
 */
function initializeEvents() {
  // Eventos da tela de boas-vindas
  addPlayerBtn.addEventListener("click", addPlayerInput);
  startGameBtn.addEventListener("click", startGame);

  // Eventos da tela de jogo
  submitAnswerBtn.addEventListener("click", handleAnswerSubmission);
  answerInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      handleAnswerSubmission();
    }
  });

  // Eventos da tela de resultados
  playAgainBtn.addEventListener("click", resetGame);
  returnHomeBtn.addEventListener("click", returnToHome);

  // Adiciona o primeiro campo de jogador
  addPlayerInput();
}

/**
 * Adiciona um novo campo de entrada para jogador
 */
function addPlayerInput() {
  const playerInput = document.createElement("div");
  playerInput.className = "player-input";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "player-name";
  input.placeholder = "Nome do jogador";

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-player";
  removeBtn.innerHTML = '<i class="fas fa-times"></i>';
  removeBtn.addEventListener("click", function () {
    playersContainer.removeChild(playerInput);
  });

  playerInput.appendChild(input);
  playerInput.appendChild(removeBtn);
  playersContainer.appendChild(playerInput);
}

/**
 * Inicia o jogo com as configurações selecionadas
 */
function startGame() {
  // Coleta os nomes dos jogadores
  const playerInputs = document.querySelectorAll(".player-name");
  players = [];

  playerInputs.forEach((input) => {
    const name = input.value.trim();
    if (name) {
      players.push({
        name: name,
        score: 0,
        correctAnswers: 0,
        totalTime: 0,
      });
    }
  });

  // Verifica se há pelo menos um jogador
  if (players.length === 0) {
    alert("Por favor, adicione pelo menos um jogador!");
    return;
  }

  // Verifica se pelo menos uma operação está selecionada
  const selectedOperations = Object.values(operationCheckboxes).filter(
    (cb) => cb.checked
  );
  if (selectedOperations.length === 0) {
    alert("Por favor, selecione pelo menos uma operação matemática!");
    return;
  }

  // Obtém as configurações do jogo
  difficulty = difficultySelect.value;
  totalQuestions = parseInt(numQuestionsInput.value) || 10;

  // Configura o jogo
  currentPlayerIndex = 0;
  currentQuestion = 0;
  gameStats = {
    totalCorrect: 0,
    totalQuestions: 0,
    totalTime: 0,
  };

  // Atualiza o display
  updatePlayerDisplay();
  updateQuestionCounter();
  scoreDisplay.textContent = `Pontos: 0`;

  // Muda para a tela do jogo
  showScreen(gameScreen);

  // Gera a primeira questão
  generateQuestion();
}

// =============== FUNÇÕES PRINCIPAIS DO JOGO ===============

/**
 * Gera uma nova questão matemática baseada no nível de dificuldade
 */
function generateQuestion() {
  // Reinicia o tempo
  resetTimer();

  // Reseta flag de processamento
  isProcessingAnswer = false;

  // Limpa o campo de resposta e feedback
  answerInput.value = "";
  feedbackDisplay.classList.add("hidden");

  // Determina quais operações estão disponíveis
  const availableOperations = [];
  if (operationCheckboxes.addition.checked) availableOperations.push("+");
  if (operationCheckboxes.subtraction.checked) availableOperations.push("-");
  if (operationCheckboxes.multiplication.checked) availableOperations.push("×");
  if (operationCheckboxes.division.checked) availableOperations.push("÷");

  // Escolhe uma operação aleatória
  const operation =
    availableOperations[Math.floor(Math.random() * availableOperations.length)];
  currentOperation = operation;

  // Remove classe ativa de todos os ícones de operação
  operationIcons.forEach((icon) => icon.classList.remove("active"));

  // Adiciona classe ativa ao ícone da operação atual
  const currentIcon = document.querySelector(
    `.operation-icon[data-op="${operationMapping[operation]}"]`
  );
  if (currentIcon) {
    currentIcon.classList.add("active");
  }

  // Gera números para a operação baseados na dificuldade
  let num1, num2;

  switch (difficulty) {
    case "facil":
      // Números de -10 a 10
      num1 = getRandomInt(-10, 10);
      num2 = getRandomInt(-10, 10);
      break;
    case "medio":
      // Números de -50 a 50
      num1 = getRandomInt(-50, 50);
      num2 = getRandomInt(-20, 20);
      break;
    case "dificil":
      // Números de -100 a 100
      num1 = getRandomInt(-100, 100);
      num2 = getRandomInt(-50, 50);
      break;
  }

  if (operation === "÷") {
    // Para divisão, garantimos que o resultado seja um número inteiro
    // Escolhemos num2 primeiro (divisor) e depois calculamos num1 (dividendo)
    // para garantir que a divisão resulte em um número inteiro
    const quotient = getRandomInt(
      -10, // Permitindo quocientes negativos também
      difficulty === "facil" ? 10 : difficulty === "medio" ? 20 : 30
    );
    // Evita divisão por zero
    num2 = num2 === 0 ? getRandomInt(1, 5) * (Math.random() < 0.5 ? -1 : 1) : num2;
    num1 = num2 * quotient;
  }

  // Calcula a resposta correta
  switch (operation) {
    case "+":
      correctAnswer = num1 + num2;
      break;
    case "-":
      correctAnswer = num1 - num2;
      break;
    case "×":
      correctAnswer = num1 * num2;
      break;
    case "÷":
      correctAnswer = num1 / num2;
      break;
  }

  // Exibe a questão com os números entre parênteses
  const num1Str = num1 < 0 ? `(${num1})` : num1.toString();
  const num2Str = num2 < 0 ? `(${num2})` : num2.toString();
  questionDisplay.textContent = `Quanto é ${num1Str} ${operation} ${num2Str}?`;

  // Dá foco ao campo de resposta
  setTimeout(() => {
    answerInput.focus();
  }, 0);

  // Inicia o timer
  startTimer();
}

/**
 * Função intermediária para evitar múltiplas submissões
 */
function handleAnswerSubmission() {
  if (isProcessingAnswer) return;
  isProcessingAnswer = true;
  checkAnswer();
}

/**
 * Verifica a resposta do jogador
 */
function checkAnswer() {
  // Interrompe o timer
  clearInterval(gameTimer);

  // Obtém a resposta do jogador
  const userAnswer = parseInt(answerInput.value) || null;

  // Verifica se a resposta está correta
  const isCorrect = userAnswer === correctAnswer;

  // Calcula pontos e tempo utilizado
  const timeUsed = 30 - timeRemaining;
  const points = isCorrect ? calculatePoints(timeUsed) : 0;

  // Atualiza os dados do jogador atual
  players[currentPlayerIndex].score += points;
  if (isCorrect) {
    players[currentPlayerIndex].correctAnswers++;
  }
  players[currentPlayerIndex].totalTime += timeUsed;

  // Atualiza as estatísticas do jogo
  gameStats.totalQuestions++;
  if (isCorrect) {
    gameStats.totalCorrect++;
  }
  gameStats.totalTime += timeUsed;

  // Exibe feedback
  showFeedback(isCorrect, points);

  // Atualiza o placar
  updateScore();

  // Agenda a próxima questão ou finaliza o jogo
  setTimeout(() => {
    currentQuestion++;

    // Verifica se todos os jogadores responderam o número total de questões
    if (currentQuestion >= totalQuestions * players.length) {
      endGame();
    } else {
      // Avança para o próximo jogador se necessário
      if (currentQuestion % totalQuestions === 0) {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        updatePlayerDisplay();
      }

      updateQuestionCounter();
      generateQuestion();
    }
  }, 2000); // Espera 2 segundos antes da próxima questão
}

/**
 * Exibe feedback visual e sonoro para a resposta
 * @param {boolean} isCorrect - Indica se a resposta está correta
 * @param {number} points - Pontos ganhos pela resposta
 */
function showFeedback(isCorrect, points) {
  feedbackDisplay.classList.remove("hidden", "correct", "incorrect");
  feedbackDisplay.classList.add(isCorrect ? "correct" : "incorrect");

  if (isCorrect) {
    feedbackDisplay.textContent = `Correto! +${points} pontos`;
    // Tenta reproduzir o som apenas se ele existir
    if (correctSound && typeof correctSound.play === 'function') {
      try {
        correctSound.currentTime = 0;
        correctSound.play().catch(e => {
          console.log("Erro ao reproduzir som:", e);
          // Ignora erro de reprodução (comum em mobile)
        });
      } catch (e) {
        console.log("Erro ao manipular áudio:", e);
      }
    }
  } else {
    feedbackDisplay.textContent = `Incorreto! A resposta correta é ${correctAnswer}`;
    // Tenta reproduzir o som apenas se ele existir
    if (wrongSound && typeof wrongSound.play === 'function') {
      try {
        wrongSound.currentTime = 0;
        wrongSound.play().catch(e => {
          console.log("Erro ao reproduzir som:", e);
          // Ignora erro de reprodução (comum em mobile)
        });
      } catch (e) {
        console.log("Erro ao manipular áudio:", e);
      }
    }
  }

  // Usa uma classe CSS para o efeito visual em vez de manipulação direta
  questionDisplay.classList.add("pulse");
  setTimeout(() => {
    questionDisplay.classList.remove("pulse");
  }, 600);
}

/**
 * Finaliza o jogo e exibe a tela de resultados
 */
function endGame() {
  // Tenta tocar o som de vitória
  if (winSound && typeof winSound.play === 'function') {
    try {
      winSound.play().catch(e => {
        console.log("Erro ao reproduzir som de vitória:", e);
      });
    } catch (e) {
      console.log("Erro ao manipular áudio:", e);
    }
  }

  // Ordena os jogadores por pontuação (do maior para o menor)
  players.sort((a, b) => b.score - a.score);

  // Limpa o container de resultados
  playerResultsContainer.innerHTML = "";

  // Adiciona resultados de cada jogador
  players.forEach((player, index) => {
    const playerResult = document.createElement("div");
    playerResult.className = "player-result";

    // Adiciona posição e nome
    const nameSpan = document.createElement("span");
    nameSpan.className = "player-name-result";
    nameSpan.textContent = `${index + 1}. ${player.name}`;

    // Adiciona número de acertos
    const correctSpan = document.createElement("span");
    correctSpan.className = "player-correct";
    correctSpan.textContent = `${player.correctAnswers} acertos`;

    playerResult.appendChild(nameSpan);
    playerResult.appendChild(correctSpan);
    playerResultsContainer.appendChild(playerResult);
  });

  // Desenha o gráfico usando requestAnimationFrame para melhor performance
  setTimeout(() => renderChart(), 0);

  // Calcula e exibe estatísticas
  const accuracy = Math.round(
    (gameStats.totalCorrect / gameStats.totalQuestions) * 100
  );
  const avgTime =
    Math.round((gameStats.totalTime / gameStats.totalQuestions) * 10) / 10;

  totalCorrectDisplay.textContent = `Respostas corretas: ${gameStats.totalCorrect} de ${gameStats.totalQuestions}`;
  accuracyDisplay.textContent = `Precisão: ${accuracy}%`;
  avgTimeDisplay.textContent = `Tempo médio por questão: ${avgTime}s`;

  // Mostra a tela de resultados
  showScreen(resultsScreen);
}

/**
 * Renderiza o gráfico de performance separado da função endGame
 * para melhor performance
 */
function renderChart() {
  try {
    // Prepara os dados para o gráfico de acertos
    const playerNames = players.map((player) => player.name);
    const correctAnswers = players.map((player) => player.correctAnswers);

    // Obtém o contexto 2D do canvas
    const chartCanvas = document.getElementById("performanceChart");
    
    if (!chartCanvas) {
      console.warn("Canvas para gráfico não encontrado");
      return;
    }
    
    const ctx = chartCanvas.getContext("2d");

    // Destrói o gráfico anterior se existir
    if (window.performanceChart instanceof Chart) {
      window.performanceChart.destroy();
    }

    // Cria o gráfico de barras para o número de acertos
    window.performanceChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: playerNames,
        datasets: [
          {
            label: "Acertos",
            data: correctAnswers,
            backgroundColor: [
              "rgba(46, 204, 113, 0.6)", // Cor verde para acertos
              "rgba(52, 152, 219, 0.6)",
              "rgba(241, 196, 15, 0.6)",
              "rgba(155, 89, 182, 0.6)",
              "rgba(230, 126, 34, 0.6)",
              "rgba(26, 188, 156, 0.6)",
            ],
            borderColor: [
              "rgba(46, 204, 113, 1)",
              "rgba(52, 152, 219, 1)",
              "rgba(241, 196, 15, 1)",
              "rgba(155, 89, 182, 1)",
              "rgba(230, 126, 34, 1)",
              "rgba(26, 188, 156, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Número de Acertos",
            },
            ticks: {
              stepSize: 1, // Garante que os ticks sejam números inteiros (contagem de acertos)
            },
          },
          x: {
            title: {
              display: true,
              text: "Jogadores",
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Desempenho dos Jogadores (Acertos)",
            font: {
              size: 16,
            },
          },
        },
        // Desativa a animação para melhor performance
        animation: {
          duration: 0,
        },
      },
    });
  } catch (e) {
    console.error("Erro ao renderizar gráfico:", e);
  }
}

/**
 * Reinicia o jogo com os mesmos jogadores e configurações
 */
function resetGame() {
  // Reinicia os pontos dos jogadores
  players.forEach((player) => {
    player.score = 0;
    player.correctAnswers = 0;
    player.totalTime = 0;
  });

  // Reinicia o jogo
  currentPlayerIndex = 0;
  currentQuestion = 0;
  gameStats = {
    totalCorrect: 0,
    totalQuestions: 0,
    totalTime: 0,
  };

  // Atualiza o display
  updatePlayerDisplay();
  updateQuestionCounter();
  scoreDisplay.textContent = `Pontos: 0`;

  // Muda para a tela do jogo
  showScreen(gameScreen);

  // Gera a primeira questão
  generateQuestion();
}

/**
 * Retorna à tela inicial
 */
function returnToHome() {
  // Limpa qualquer timer pendente
  clearInterval(gameTimer);
  showScreen(welcomeScreen);
}

// =============== FUNÇÕES UTILITÁRIAS ===============

/**
 * Exibe uma tela específica e esconde as outras
 * @param {HTMLElement} screen - Tela a ser exibida
 */
function showScreen(screen) {
  // Remove a classe active de todas as telas
  welcomeScreen.classList.remove("active");
  gameScreen.classList.remove("active");
  resultsScreen.classList.remove("active");

  // Adiciona a classe active à tela desejada
  screen.classList.add("active");
}

/**
 * Atualiza o nome do jogador atual na tela
 */
function updatePlayerDisplay() {
  currentPlayerDisplay.textContent = `Jogador: ${players[currentPlayerIndex].name}`;
}

/**
 * Atualiza o contador de questões
 */
function updateQuestionCounter() {
  const currentPlayerQuestion = (currentQuestion % totalQuestions) + 1;
  questionCounterDisplay.textContent = `Questão ${currentPlayerQuestion} de ${totalQuestions}`;
}

/**
 * Atualiza o placar do jogador atual
 */
function updateScore() {
  scoreDisplay.textContent = `Pontos: ${players[currentPlayerIndex].score}`;
}

/**
 * Inicia o timer para a questão atual com otimizações
 */
function startTimer() {
  timeRemaining = 30;
  timeLeftDisplay.textContent = timeRemaining;
  lastTimerUpdate = Date.now();

  clearInterval(gameTimer);
  gameTimer = setInterval(() => {
    // Calcula o tempo decorrido desde a última atualização
    const now = Date.now();
    const elapsed = (now - lastTimerUpdate) / 1000;
    lastTimerUpdate = now;
    
    // Se houver um atraso significativo, ajusta o tempo
    if (elapsed > 1.5) {
      timeRemaining -= Math.floor(elapsed);
    } else {
      timeRemaining--;
    }
    
    // Não permite tempo negativo
    if (timeRemaining < 0) timeRemaining = 0;
    
    timeLeftDisplay.textContent = timeRemaining;

    // Efeito visual de urgência quando o tempo está acabando
    // Usa classes CSS em vez de manipulação direta do estilo
    if (timeRemaining <= 5) {
      timeLeftDisplay.classList.add("time-critical");
    } else {
      timeLeftDisplay.classList.remove("time-critical");
    }

    // Tempo esgotado
    if (timeRemaining <= 0) {
      clearInterval(gameTimer);
      // Resposta automática incorreta
      if (!isProcessingAnswer) {
        handleAnswerSubmission();
      }
    }
  }, 1000);
}

/**
 * Reinicia o timer
 */
function resetTimer() {
  timeRemaining = 30;
  timeLeftDisplay.textContent = timeRemaining;
  timeLeftDisplay.classList.remove("time-critical");
  clearInterval(gameTimer);
}

/**
 * Calcula os pontos com base no tempo utilizado
 * @param {number} timeUsed - Tempo utilizado para responder (em segundos)
 * @returns {number} - Pontos ganhos
 */
function calculatePoints(timeUsed) {
  // Pontuação base de acordo com a dificuldade
  let basePoints;
  switch (difficulty) {
    case "facil":
      basePoints = 10;
      break;
    case "medio":
      basePoints = 20;
      break;
    case "dificil":
      basePoints = 30;
      break;
    default:
      basePoints = 10;
  }

  // Bônus por resposta rápida
  let timeBonus = 0;
  if (timeUsed < 5) {
    timeBonus = 10;
  } else if (timeUsed < 10) {
    timeBonus = 5;
  } else if (timeUsed < 15) {
    timeBonus = 3;
  }

  return basePoints + timeBonus;
}

/**
 * Gera um número inteiro aleatório entre min e max (inclusive)
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} - Número aleatório
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Inicializa o jogo quando a página carregar
document.addEventListener("DOMContentLoaded", initializeEvents);

// Adicionar esta CSS no seu arquivo de estilo
/*
.time-critical {
  color: #e74c3c;
  font-weight: bold;
}

.pulse {
  animation: pulse-animation 0.6s;
}

@keyframes pulse-animation {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.1);
  }
  50% {
    transform: scale(1);
  }
  75% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
*/
