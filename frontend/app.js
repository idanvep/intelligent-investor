const form = document.getElementById('calculator-form');
const calculateButton = document.getElementById('calculate-button');
const formMessage = document.getElementById('form-message');
const resultsSection = document.getElementById('results-section');
const emptyState = document.getElementById('empty-state');
const profileNameInput =
  document.getElementById('profile-name');

const saveProfileButton =
  document.getElementById('save-profile-button');

const refreshProfilesButton =
  document.getElementById('refresh-profiles-button');

const profilesList =
  document.getElementById('profiles-list');

const profileMessage =
  document.getElementById('profile-message');

let latestProjection = [];
let latestPlan = null;

const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function showError(message) {
  formMessage.textContent = message;
}

function clearError() {
  formMessage.textContent = '';
}

function renderResults(data, years) {
  setText('result-bank-net', formatCurrency(data.bankNet));
  setText('result-investment', formatCurrency(data.activeInvestments));

  const finalValue =
    data.wealthProjection[data.wealthProjection.length - 1] || 0;

  setText('result-final-wealth', formatCurrency(finalValue));
  setText('result-period', `After ${years} years`);

  setText('fixed-costs', formatCurrency(data.fixedCosts));
  setText('savings-goals', formatCurrency(data.savingsGoals));
  setText('active-investments', formatCurrency(data.activeInvestments));
  setText('guilt-free', formatCurrency(data.guiltFreeSpending));

  latestProjection = data.wealthProjection;
  
  latestPlan = {
    grossSalary: Number(data.grossSalary),
    bankNet: Number(data.bankNet),
    years: Number(years),
  };

  saveProfileButton.disabled = false;

  emptyState.classList.add('hidden');
  resultsSection.classList.remove('hidden');

  renderProjectionTable(data.wealthProjection);
  drawWealthChart(data.wealthProjection);
}

function renderProjectionTable(projection) {
  const table = document.getElementById('projection-table');
  table.innerHTML = '';

  const selectedYears = projection
    .map((value, index) => ({
      year: index + 1,
      value,
    }))
    .filter((item, index, array) => {
      const isFirst = index === 0;
      const isLast = index === array.length - 1;
      const interval = Math.max(1, Math.floor(array.length / 4));

      return isFirst || isLast || (index + 1) % interval === 0;
    })
    .slice(0, 5);

  selectedYears.forEach((item) => {
    const element = document.createElement('div');
    element.className = 'projection-item';

    element.innerHTML = `
      <span>Year ${item.year}</span>
      <strong>${formatCurrency(item.value)}</strong>
    `;

    table.appendChild(element);
  });
}

function drawWealthChart(projection) {
  const canvas = document.getElementById('wealth-chart');
  const container = canvas.parentElement;

  const ratio = window.devicePixelRatio || 1;
  const width = container.clientWidth;
  const height = container.clientHeight;

  canvas.width = width * ratio;
  canvas.height = height * ratio;

  const context = canvas.getContext('2d');
  context.scale(ratio, ratio);
  context.clearRect(0, 0, width, height);

  if (!projection.length) {
    return;
  }

  const padding = {
    top: 25,
    right: 25,
    bottom: 45,
    left: 75,
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maximum = Math.max(...projection) * 1.1;

  context.font = '12px system-ui';
  context.lineWidth = 1;

  for (let index = 0; index <= 4; index++) {
    const y = padding.top + (chartHeight / 4) * index;
    const value = maximum - (maximum / 4) * index;

    context.strokeStyle = '#e2e9e7';
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();

    context.fillStyle = '#6d7b7a';
    context.textAlign = 'right';
    context.fillText(
      compactCurrency(value),
      padding.left - 12,
      y + 4
    );
  }

  const points = projection.map((value, index) => {
    const x =
      projection.length === 1
        ? padding.left + chartWidth / 2
        : padding.left +
          (index / (projection.length - 1)) * chartWidth;

    const y =
      padding.top +
      chartHeight -
      (value / maximum) * chartHeight;

    return { x, y, value, year: index + 1 };
  });

  const gradient = context.createLinearGradient(
    0,
    padding.top,
    0,
    height - padding.bottom
  );

  gradient.addColorStop(0, 'rgba(21, 122, 110, 0.30)');
  gradient.addColorStop(1, 'rgba(21, 122, 110, 0.02)');

  context.beginPath();
  context.moveTo(points[0].x, height - padding.bottom);

  points.forEach((point) => {
    context.lineTo(point.x, point.y);
  });

  context.lineTo(
    points[points.length - 1].x,
    height - padding.bottom
  );

  context.closePath();
  context.fillStyle = gradient;
  context.fill();

  context.beginPath();

  points.forEach((point, index) => {
    if (index === 0) {
      context.moveTo(point.x, point.y);
    } else {
      context.lineTo(point.x, point.y);
    }
  });

  context.strokeStyle = '#157a6e';
  context.lineWidth = 3;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.stroke();

  points.forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, 4, 0, Math.PI * 2);
    context.fillStyle = '#ffffff';
    context.fill();
    context.strokeStyle = '#157a6e';
    context.lineWidth = 2;
    context.stroke();
  });

  const labelIndexes = new Set([
    0,
    Math.floor((points.length - 1) / 2),
    points.length - 1,
  ]);

  context.fillStyle = '#6d7b7a';
  context.textAlign = 'center';
  context.font = '12px system-ui';

  points.forEach((point, index) => {
    if (labelIndexes.has(index)) {
      context.fillText(
        `Year ${point.year}`,
        point.x,
        height - 17
      );
    }
  });
}

function compactCurrency(value) {
  const number = Number(value) || 0;

  if (number >= 1000000) {
    return `₪${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `₪${Math.round(number / 1000)}K`;
  }

  return `₪${Math.round(number)}`;
}
function showProfileMessage(message, type = 'success') {
  profileMessage.textContent = message;
  profileMessage.className = `profile-message ${type}`;
}

function clearProfileMessage() {
  profileMessage.textContent = '';
  profileMessage.className = 'profile-message';
}

async function saveCurrentProfile() {
  clearProfileMessage();

  if (!latestPlan) {
    showProfileMessage(
      'Calculate a financial plan before saving.',
      'error'
    );
    return;
  }

  const profileName = profileNameInput.value.trim();

  if (!profileName) {
    showProfileMessage(
      'Please enter a profile name.',
      'error'
    );
    return;
  }

  saveProfileButton.disabled = true;
  saveProfileButton.textContent = 'Saving...';

  try {
    const response = await fetch(
      'http://localhost:3001/profiles',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileName,
          grossSalary: latestPlan.grossSalary,
          bankNet: latestPlan.bankNet,
          years: latestPlan.years,
        }),
      }
    );

    const profile = await response.json();

    if (!response.ok) {
      throw new Error(
        profile.error || 'Could not save the profile.'
      );
    }

    showProfileMessage(
      `Profile "${profile.profileName}" was saved.`
    );

    profileNameInput.value = '';

    await loadProfiles();
  } catch (error) {
    showProfileMessage(error.message, 'error');
  } finally {
    saveProfileButton.disabled = !latestPlan;
    saveProfileButton.textContent = 'Save current plan';
  }
}

async function loadProfiles() {
  refreshProfilesButton.disabled = true;

  try {
    const response = await fetch(
      'http://localhost:3001/profiles'
    );

    const profiles = await response.json();

    if (!response.ok) {
      throw new Error(
        profiles.error || 'Could not load profiles.'
      );
    }

    renderProfiles(profiles);
  } catch (error) {
    profilesList.innerHTML = '';

    const message = document.createElement('p');
    message.className = 'profiles-empty';
    message.textContent = error.message;

    profilesList.appendChild(message);
  } finally {
    refreshProfilesButton.disabled = false;
  }
}

function renderProfiles(profiles) {
  profilesList.innerHTML = '';

  if (!profiles.length) {
    const message = document.createElement('p');
    message.className = 'profiles-empty';
    message.textContent = 'No saved profiles yet.';

    profilesList.appendChild(message);
    return;
  }

  profiles.forEach((profile) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'saved-profile-button';

    const info = document.createElement('span');
    info.className = 'saved-profile-info';

    const name = document.createElement('span');
    name.className = 'saved-profile-name';
    name.textContent = profile.profileName;

    const details = document.createElement('span');
    details.className = 'saved-profile-details';
    details.textContent =
      `${profile.years} years · ` +
      `${formatCurrency(profile.result.bankNet)} net`;

    const id = document.createElement('span');
    id.className = 'saved-profile-id';
    id.textContent = `#${profile.id}`;

    info.appendChild(name);
    info.appendChild(details);

    button.appendChild(info);
    button.appendChild(id);

    button.addEventListener('click', () => {
      loadProfile(profile.id);
    });

    profilesList.appendChild(button);
  });
}

async function loadProfile(profileId) {
  clearProfileMessage();

  try {
    const response = await fetch(
      `http://localhost:3001/profiles/${profileId}`
    );

    const profile = await response.json();

    if (!response.ok) {
      throw new Error(
        profile.error || 'Could not load the profile.'
      );
    }

    document.getElementById('salary').value =
      profile.result.grossSalary;

    document.getElementById('bank-net').value =
      profile.result.bankNet;

    document.getElementById('years').value =
      profile.years;

    renderResults(profile.result, profile.years);

    showProfileMessage(
      `Profile "${profile.profileName}" was loaded.`
    );
  } catch (error) {
    showProfileMessage(error.message, 'error');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  const grossSalary = Number(
    document.getElementById('salary').value
  );

  const bankNetInput =
    document.getElementById('bank-net').value.trim();

  const years = Number(
    document.getElementById('years').value
  );

  if (!grossSalary || grossSalary <= 0) {
    showError('Please enter a valid positive gross salary.');
    return;
  }

  const requestBody = {
    grossSalary,
    years,
  };

  if (bankNetInput !== '') {
    const bankNet = Number(bankNetInput);

    if (!bankNet || bankNet <= 0) {
      showError('Bank net must be a positive number.');
      return;
    }

    requestBody.bankNet = bankNet;
  }

  calculateButton.disabled = true;
  calculateButton.textContent = 'Calculating...';

  try {
    const response = await fetch(
      'http://localhost:3001/calculate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || 'The calculation could not be completed.'
      );
    }

    renderResults(data, years);
  } catch (error) {
    showError(
      error.message ||
        'Could not connect to the backend. Check Docker Compose.'
    );
  } finally {
    calculateButton.disabled = false;
    calculateButton.textContent = 'Calculate financial plan';
  }
});

window.addEventListener('resize', () => {
  if (latestProjection.length) {
    drawWealthChart(latestProjection);
  }
});

saveProfileButton.addEventListener(
  'click',
  saveCurrentProfile
);

refreshProfilesButton.addEventListener(
  'click',
  loadProfiles
);

loadProfiles();