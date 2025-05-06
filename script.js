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
let gameStartTime = 0; // Timestamp do início do jogo
let currentQuestionStartTime = 0; // Timestamp do início da questão atual
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
let gameTimeElapsed = 0; // Tempo total decorrido do jogo em segundos

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
        questionsAnswerTime: [], // Armazena o tempo de resposta para cada questão
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
  gameTimeElapsed = 0;

  // Atualiza o display
  updatePlayerDisplay();
  updateQuestionCounter();
  scoreDisplay.textContent = `Pontos: 0`;

  // Muda para a tela do jogo e inicia o temporizador geral
  showScreen(gameScreen);
  
  // Inicia o temporizador geral
  gameStartTime = Date.now();
  startGameTimer();

  // Gera a primeira questão
  generateQuestion();
}

// =============== FUNÇÕES PRINCIPAIS DO JOGO ===============

/**
 * Inicia o temporizador geral do jogo
 */
function startGameTimer() {
  lastTimerUpdate = Date.now();
  gameTimer = setInterval(() => {
    // Calcula o tempo decorrido desde a última atualização
    const now = Date.now();
    const elapsed = (now - lastTimerUpdate) / 1000;
    lastTimerUpdate = now;
    
    // Atualiza o tempo total decorrido
    gameTimeElapsed += elapsed;
    
    // Formata o tempo para exibição (minutos:segundos)
    const minutes = Math.floor(gameTimeElapsed / 60);
    const seconds = Math.floor(gameTimeElapsed % 60);
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Atualiza o display de tempo
    timeLeftDisplay.textContent = formattedTime;
  }, 1000);
}

/**
 * Gera uma nova questão matemática baseada no nível de dificuldade
 */
function generateQuestion() {
  // Reseta flag de processamento
  isProcessingAnswer = false;

  // Registra o momento de início da questão atual
  currentQuestionStartTime = Date.now();

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
}

/**
 * Função intermediária para evitar múltiplas submissões
 */
/**
 * Verifica a resposta do jogador
 */
function checkAnswer() {
  // Obtém a resposta do jogador
  // CORREÇÃO: Tratamento especial para quando a resposta é zero
  const userInput = answerInput.value.trim();
  const userAnswer = userInput === "" ? null : parseInt(userInput);

  // Verifica se a resposta está correta
  const isCorrect = userAnswer === correctAnswer;

  // Calcula o tempo que o jogador levou para responder (em segundos)
  const responseTime = (Date.now() - currentQuestionStartTime) / 1000;
  
  // Armazena o tempo de resposta para esta questão
  players[currentPlayerIndex].questionsAnswerTime.push(responseTime);

  // Calcula pontos com base na rapidez e dificuldade
  const points = isCorrect ? calculatePoints(responseTime) : 0;

  // Atualiza os dados do jogador atual
  players[currentPlayerIndex].score += points;
  if (isCorrect) {
    players[currentPlayerIndex].correctAnswers++;
  }

  // Atualiza as estatísticas do jogo
  gameStats.totalQuestions++;
  if (isCorrect) {
    gameStats.totalCorrect++;
  }
  gameStats.totalTime += responseTime;

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
  // Para o temporizador geral
  clearInterval(gameTimer);
  
  // Calcula o tempo total da partida
  const totalGameTime = (Date.now() - gameStartTime) / 1000;

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

    // Adiciona container para as estatísticas
    const statsContainer = document.createElement("div");
    statsContainer.className = "player-stats";

    // Adiciona pontos
    const pointsSpan = document.createElement("span");
    pointsSpan.className = "player-points";
    pointsSpan.innerHTML = `<strong>Pontos:</strong> ${player.score}`;

    // Adiciona número de acertos
    const correctSpan = document.createElement("span");
    correctSpan.className = "player-correct";
    correctSpan.innerHTML = `<strong>Acertos:</strong> ${player.correctAnswers}`;

    // Adiciona taxa de acerto
    const accuracySpan = document.createElement("span");
    accuracySpan.className = "player-accuracy";
    const playerAccuracy = Math.round((player.correctAnswers / totalQuestions) * 100);
    accuracySpan.innerHTML = `<strong>Taxa:</strong> ${playerAccuracy}%`;

    // Adiciona tempo médio por resposta
    const avgTimeSpan = document.createElement("span");
    avgTimeSpan.className = "player-avg-time";
    const avgTime = player.questionsAnswerTime.reduce((acc, time) => acc + time, 0) / player.questionsAnswerTime.length;
    avgTimeSpan.innerHTML = `<strong>Tempo médio:</strong> ${avgTime.toFixed(1)}s`;

    // Adiciona tudo ao container de estatísticas
    statsContainer.appendChild(pointsSpan);
    statsContainer.appendChild(correctSpan);
    statsContainer.appendChild(accuracySpan);
    statsContainer.appendChild(avgTimeSpan);

    playerResult.appendChild(nameSpan);
    playerResult.appendChild(statsContainer);
    playerResultsContainer.appendChild(playerResult);
  });

  // Desenha o gráfico usando requestAnimationFrame para melhor performance
  setTimeout(() => renderChart(), 0);

  // Calcula e exibe estatísticas
  const accuracy = Math.round(
    (gameStats.totalCorrect / gameStats.totalQuestions) * 100
  );
  const avgTime = Math.round((gameStats.totalTime / gameStats.totalQuestions) * 10) / 10;

  totalCorrectDisplay.textContent = `Respostas corretas: ${gameStats.totalCorrect} de ${gameStats.totalQuestions}`;
  accuracyDisplay.textContent = `Precisão: ${accuracy}%`;
  
  // Formata o tempo total da partida
  const minutes = Math.floor(totalGameTime / 60);
  const seconds = Math.floor(totalGameTime % 60);
  const formattedTotalTime = `${minutes}m ${seconds}s`;
  
  avgTimeDisplay.textContent = `Tempo total da partida: ${formattedTotalTime} | Tempo médio por questão: ${avgTime.toFixed(1)}s`;

  // Mostra a tela de resultados
  showScreen(resultsScreen);
}

/**
 * Renderiza o gráfico de performance separado da função endGame
 * para melhor performance
 */
function renderChart() {
  try {
    // Prepara os dados para o gráfico
    const playerNames = players.map((player) => player.name);
    const correctAnswers = players.map((player) => player.correctAnswers);
    const playerScores = players.map((player) => player.score);
    const avgTimes = players.map((player) => {
      return player.questionsAnswerTime.reduce((acc, time) => acc + time, 0) / player.questionsAnswerTime.length;
    });

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

    // Cores para os datasets
    const acertosColors = {
      backgroundColor: "rgba(46, 204, 113, 0.6)", // Verde
      borderColor: "rgba(46, 204, 113, 1)"
    };
    
    const pontosColors = {
      backgroundColor: "rgba(52, 152, 219, 0.6)", // Azul
      borderColor: "rgba(52, 152, 219, 1)"
    };
    
    const tempoColors = {
      backgroundColor: "rgba(243, 156, 18, 0.6)", // Laranja
      borderColor: "rgba(243, 156, 18, 1)"
    };

    // Cria o gráfico de barras para acertos, pontos e tempo médio
    window.performanceChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: playerNames,
        datasets: [
          {
            label: "Acertos",
            data: correctAnswers,
            backgroundColor: acertosColors.backgroundColor,
            borderColor: acertosColors.borderColor,
            borderWidth: 1,
            order: 1
          },
          {
            label: "Pontos",
            data: playerScores,
            backgroundColor: pontosColors.backgroundColor,
            borderColor: pontosColors.borderColor,
            borderWidth: 1,
            order: 0,
            yAxisID: 'y1'
          },
          {
            label: "Tempo Médio (s)",
            data: avgTimes,
            backgroundColor: tempoColors.backgroundColor,
            borderColor: tempoColors.borderColor,
            borderWidth: 1,
            order: 2,
            type: 'line',
            yAxisID: 'y2'
          }
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            title: {
              display: true,
              text: "Número de Acertos",
            },
            ticks: {
              stepSize: 1, // Garante que os ticks sejam números inteiros
            },
            grid: {
              display: true
            }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            title: {
              display: true,
              text: "Pontuação Total",
            },
            grid: {
              display: false
            }
          },
          y2: {
            beginAtZero: true,
            position: 'right',
            title: {
              display: true,
              text: "Tempo (s)",
            },
            grid: {
              display: false
            },
            display: false // Oculta este eixo para evitar confusão visual
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
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: "Desempenho dos Jogadores",
            font: {
              size: 16,
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (label.includes("Tempo")) {
                  label += context.raw.toFixed(1) + 's';
                } else {
                  label += context.raw;
                }
                return label;
              }
            }
          }
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
    player.questionsAnswerTime = [];
  });

  // Reinicia o jogo
  currentPlayerIndex = 0;
  currentQuestion = 0;
  gameStats = {
    totalCorrect: 0,
    totalQuestions: 0,
    totalTime: 0,
  };
  gameTimeElapsed = 0;

  // Atualiza o display
  updatePlayerDisplay();
  updateQuestionCounter();
  scoreDisplay.textContent = `Pontos: 0`;

  // Muda para a tela do jogo
  showScreen(gameScreen);
  
  // Reinicia o temporizador geral
  gameStartTime = Date.now();
  startGameTimer();

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
 * Calcula os pontos com base no tempo utilizado
 * @param {number} responseTime - Tempo utilizado para responder (em segundos)
 * @returns {number} - Pontos ganhos
 */
function calculatePoints(responseTime) {
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
  if (responseTime < 5) {
    timeBonus = 10;
  } else if (responseTime < 10) {
    timeBonus = 5;
  } else if (responseTime < 15) {
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
.time-display {
  font-size: 1.2rem;
  font-weight: bold;
  color: #2980b9;
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
