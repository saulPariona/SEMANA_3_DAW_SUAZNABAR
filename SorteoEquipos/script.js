const STORAGE_KEY = "sorteo-equipos-participantes";
const MAX_PARTICIPANTS = 100;
const MAX_NAME_LENGTH = 50;

const participantsInput = document.querySelector("#participants");
const participantCount = document.querySelector("#participant-count");
const participantStatus = document.querySelector("#participant-status");
const splitValue = document.querySelector("#split-value");
const splitHelp = document.querySelector("#split-help");
const teamTitleInput = document.querySelector("#team-title");
const drawButton = document.querySelector("#draw-button");
const redrawButton = document.querySelector("#redraw-button");
const results = document.querySelector("#results");
const resultsTitle = document.querySelector("#results-title");
const teamsGrid = document.querySelector("#teams-grid");
const splitModeInputs = document.querySelectorAll("input[name=\"split-mode\"]");

function getParticipantLines() {
  return participantsInput.value
    .split("\n")
    .map((participant) => participant.trim())
    .filter(Boolean);
}

function updateParticipantFeedback() {
  const rawLines = participantsInput.value.split("\n").filter((line) => line.trim());
  const participants = getParticipantLines();
  const hasLongName = rawLines.some((participant) => participant.trim().length > MAX_NAME_LENGTH);
  const tooManyParticipants = rawLines.length > MAX_PARTICIPANTS;
  const hasError = hasLongName || tooManyParticipants;

  participantCount.textContent = `${participants.length} participante${participants.length === 1 ? "" : "s"}`;
  participantStatus.textContent = hasLongName
    ? "Cada participante debe tener máximo 50 caracteres"
    : tooManyParticipants
      ? "El máximo es de 100 participantes"
      : "Máximo 100 participantes";
  participantStatus.classList.toggle("is-invalid", hasError);
  participantsInput.setCustomValidity(hasError ? participantStatus.textContent : "");

  updateSplitOptions(participants.length);
}

function saveParticipants() {
  localStorage.setItem(STORAGE_KEY, participantsInput.value);
}

function updateSplitOptions(participantCountValue = getParticipantLines().length) {
  const selectedMode = document.querySelector("input[name=\"split-mode\"]:checked").value;
  const previousValue = Number(splitValue.value);
  const maximum = selectedMode === "teams"
    ? Math.max(1, Math.min(20, participantCountValue || 10))
    : Math.max(1, Math.min(20, participantCountValue || 10));
  const minimum = 1;

  splitValue.innerHTML = "";
  for (let value = minimum; value <= maximum; value += 1) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    splitValue.append(option);
  }

  if (previousValue >= minimum && previousValue <= maximum) {
    splitValue.value = previousValue;
  } else {
    splitValue.value = selectedMode === "teams" ? Math.min(2, maximum) : 1;
  }

  splitHelp.textContent = selectedMode === "teams"
    ? "Se crearán equipos equilibrados."
    : "Cada equipo tendrá esta cantidad de participantes.";
}

function shuffle(participants) {
  const shuffled = [...participants];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function createTeams(participants) {
  const selectedMode = document.querySelector("input[name=\"split-mode\"]:checked").value;
  const amount = Number(splitValue.value);
  const teamCount = selectedMode === "teams"
    ? Math.min(amount, participants.length)
    : Math.ceil(participants.length / amount);
  const teams = Array.from({ length: teamCount }, () => []);

  shuffle(participants).forEach((participant, index) => {
    teams[index % teamCount].push(participant);
  });

  return teams;
}

function renderResults(teams) {
  const teamTitle = teamTitleInput.value.trim() || "Equipo";
  resultsTitle.textContent = `${teamTitle}: ${teams.length} equipos`;
  teamsGrid.innerHTML = "";

  teams.forEach((team, index) => {
    const card = document.createElement("article");
    card.className = "team-card";
    const title = document.createElement("h3");
    title.textContent = `${teamTitle} ${index + 1}`;
    const members = document.createElement("ol");

    team.forEach((participant) => {
      const member = document.createElement("li");
      member.textContent = participant;
      members.append(member);
    });

    card.append(title, members);
    teamsGrid.append(card);
  });

  results.hidden = false;
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function drawTeams() {
  const participants = getParticipantLines();
  const invalidName = participants.some((participant) => participant.length > MAX_NAME_LENGTH);

  if (participants.length === 0) {
    participantStatus.textContent = "Agrega al menos un participante";
    participantStatus.classList.add("is-invalid");
    participantsInput.focus();
    return;
  }

  if (participants.length > MAX_PARTICIPANTS || invalidName) {
    updateParticipantFeedback();
    participantsInput.focus();
    return;
  }

  renderResults(createTeams(participants));
}

const savedParticipants = localStorage.getItem(STORAGE_KEY);
if (savedParticipants) {
  participantsInput.value = savedParticipants;
}

participantsInput.addEventListener("input", () => {
  saveParticipants();
  updateParticipantFeedback();
});

splitModeInputs.forEach((input) => {
  input.addEventListener("change", () => updateSplitOptions());
});

drawButton.addEventListener("click", drawTeams);
redrawButton.addEventListener("click", drawTeams);

updateParticipantFeedback();
