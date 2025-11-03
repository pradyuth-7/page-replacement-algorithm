// Global variables
let currentStep = 0;
let executionSteps = [];
let autoPlayInterval = null;

// DOM elements
const pageSequenceInput = document.getElementById('pageSequence');
const frameSizeInput = document.getElementById('frameSize');
const runFIFOBtn = document.getElementById('runFIFO');
const runLRUBtn = document.getElementById('runLRU');
const resetBtn = document.getElementById('reset');
const resultsSection = document.getElementById('resultsSection');
const algorithmName = document.getElementById('algorithmName');
const totalFaults = document.getElementById('totalFaults');
const totalPages = document.getElementById('totalPages');
const hitRatio = document.getElementById('hitRatio');
const visualization = document.getElementById('visualization');
const stepControls = document.getElementById('stepControls');
const prevStepBtn = document.getElementById('prevStep');
const nextStepBtn = document.getElementById('nextStep');
const stepInfo = document.getElementById('stepInfo');
const autoPlayBtn = document.getElementById('autoPlay');

// Event listeners
runFIFOBtn.addEventListener('click', () => runAlgorithm('FIFO'));
runLRUBtn.addEventListener('click', () => runAlgorithm('LRU'));
resetBtn.addEventListener('click', reset);
prevStepBtn.addEventListener('click', () => navigateStep(-1));
nextStepBtn.addEventListener('click', () => navigateStep(1));
autoPlayBtn.addEventListener('click', toggleAutoPlay);

// FIFO Algorithm Implementation
function fifo(pageSequence, frameSize) {
    const frames = [];
    const queue = []; // Queue to track order of pages in frames
    const steps = [];
    let pageFaults = 0;

    for (let i = 0; i < pageSequence.length; i++) {
        const page = pageSequence[i];
        const step = {
            step: i + 1,
            page: page,
            frames: [],
            fault: false,
            replacedPage: null,
            queue: []
        };

        // Copy current frames state
        step.frames = [...frames];
        step.queue = [...queue];

        if (frames.includes(page)) {
            // Page hit
            step.fault = false;
        } else {
            // Page fault
            pageFaults++;
            step.fault = true;

            if (frames.length < frameSize) {
                // There's space, just add the page
                frames.push(page);
                queue.push(page);
            } else {
                // No space, replace the oldest page (FIFO)
                const replacedPage = queue.shift();
                const index = frames.indexOf(replacedPage);
                frames[index] = page;
                queue.push(page);
                step.replacedPage = replacedPage;
            }

            // Update frames in step
            step.frames = [...frames];
            step.queue = [...queue];
        }

        steps.push(step);
    }

    return { steps, pageFaults };
}

// LRU Algorithm Implementation
function lru(pageSequence, frameSize) {
    const frames = [];
    const lastUsed = {}; // Track when each page was last used
    const steps = [];
    let pageFaults = 0;
    let timeCounter = 0;

    for (let i = 0; i < pageSequence.length; i++) {
        const page = pageSequence[i];
        timeCounter++;
        const step = {
            step: i + 1,
            page: page,
            frames: [],
            fault: false,
            replacedPage: null,
            lastUsed: {}
        };

        // Copy current frames state
        step.frames = [...frames];
        step.lastUsed = { ...lastUsed };

        if (frames.includes(page)) {
            // Page hit - update last used time
            step.fault = false;
            lastUsed[page] = timeCounter;
            step.lastUsed = { ...lastUsed };
        } else {
            // Page fault
            pageFaults++;
            step.fault = true;

            if (frames.length < frameSize) {
                // There's space, just add the page
                frames.push(page);
                lastUsed[page] = timeCounter;
            } else {
                // No space, find and replace the least recently used page
                let lruPage = frames[0];
                let lruTime = lastUsed[lruPage] || 0;

                for (const framePage of frames) {
                    const pageTime = lastUsed[framePage] || 0;
                    if (pageTime < lruTime) {
                        lruTime = pageTime;
                        lruPage = framePage;
                    }
                }

                const index = frames.indexOf(lruPage);
                frames[index] = page;
                delete lastUsed[lruPage];
                lastUsed[page] = timeCounter;
                step.replacedPage = lruPage;
            }

            step.frames = [...frames];
            step.lastUsed = { ...lastUsed };
        }

        steps.push(step);
    }

    return { steps, pageFaults };
}

// Run selected algorithm
function runAlgorithm(algorithm) {
    // Parse input
    const pageSequenceStr = pageSequenceInput.value.trim();
    const pageSequence = pageSequenceStr.split(/\s+/).map(num => parseInt(num)).filter(num => !isNaN(num));
    const frameSize = parseInt(frameSizeInput.value);

    if (pageSequence.length === 0) {
        alert('Please enter a valid page sequence!');
        return;
    }

    if (frameSize < 1 || frameSize > 10) {
        alert('Frame size must be between 1 and 10!');
        return;
    }

    // Stop auto-play if running
    stopAutoPlay();

    // Run algorithm
    let result;
    if (algorithm === 'FIFO') {
        result = fifo(pageSequence, frameSize);
        algorithmName.textContent = 'First In First Out (FIFO) Algorithm';
    } else {
        result = lru(pageSequence, frameSize);
        algorithmName.textContent = 'Least Recently Used (LRU) Algorithm';
    }

    executionSteps = result.steps;
    currentStep = 0;

    // Update statistics
    totalFaults.textContent = result.pageFaults;
    totalPages.textContent = pageSequence.length;
    const hitCount = pageSequence.length - result.pageFaults;
    const hitRatioPercent = ((hitCount / pageSequence.length) * 100).toFixed(2);
    hitRatio.textContent = `${hitRatioPercent}%`;

    // Show results section
    resultsSection.classList.add('active');
    stepControls.style.display = 'flex';

    // Display first step
    displayStep(0);
}

// Display a specific step
function displayStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= executionSteps.length) {
        return;
    }

    currentStep = stepIndex;
    const step = executionSteps[stepIndex];

    // Update step info
    stepInfo.textContent = `Step ${step.step} of ${executionSteps.length}`;

    // Clear visualization
    visualization.innerHTML = '';

    // Display all steps up to current step
    for (let i = 0; i <= stepIndex; i++) {
        const currentStepData = executionSteps[i];
        const stepContainer = document.createElement('div');
        stepContainer.className = 'step-container';
        
        if (i === stepIndex) {
            stepContainer.classList.add('active');
        }

        // Step header
        const stepHeader = document.createElement('div');
        stepHeader.className = 'step-header';
        
        const stepNumber = document.createElement('span');
        stepNumber.className = 'step-number';
        stepNumber.textContent = `Step ${currentStepData.step}`;
        
        const currentPage = document.createElement('span');
        currentPage.className = 'current-page';
        currentPage.textContent = `Accessing Page: ${currentStepData.page}`;

        stepHeader.appendChild(stepNumber);
        stepHeader.appendChild(currentPage);

        if (currentStepData.fault) {
            const faultBadge = document.createElement('span');
            faultBadge.className = 'page-fault';
            faultBadge.textContent = 'PAGE FAULT';
            stepHeader.appendChild(faultBadge);
        } else {
            const hitBadge = document.createElement('span');
            hitBadge.className = 'page-hit';
            hitBadge.textContent = 'HIT';
            stepHeader.appendChild(hitBadge);
        }

        stepContainer.appendChild(stepHeader);

        // Frames visualization
        const framesContainer = document.createElement('div');
        framesContainer.className = 'frames-container';

        // Create frame cells
        const frameSize = parseInt(frameSizeInput.value);
        for (let j = 0; j < frameSize; j++) {
            const frame = document.createElement('div');
            frame.className = 'frame';
            
            const frameLabel = document.createElement('div');
            frameLabel.className = 'frame-label';
            frameLabel.textContent = `Frame ${j + 1}`;
            
            const frameNumber = document.createElement('div');
            frameNumber.className = 'frame-number';

            if (j < currentStepData.frames.length) {
                const pageInFrame = currentStepData.frames[j];
                frameNumber.textContent = pageInFrame;

                // Highlight if this is the current step
                if (i === stepIndex) {
                    // Check if this page was just added/replaced
                    if (currentStepData.fault && pageInFrame === currentStepData.page) {
                        if (currentStepData.replacedPage) {
                            frame.classList.add('replaced');
                        } else {
                            frame.classList.add('new');
                        }
                    } else if (!currentStepData.fault && pageInFrame === currentStepData.page) {
                        frame.classList.add('hit');
                    }
                }
            } else {
                frame.classList.add('empty');
                frameNumber.textContent = '-';
            }

            frame.appendChild(frameLabel);
            frame.appendChild(frameNumber);
            framesContainer.appendChild(frame);
        }

        stepContainer.appendChild(framesContainer);

        // Additional info based on algorithm
        if (algorithmName.textContent.includes('FIFO')) {
            if (currentStepData.queue && currentStepData.queue.length > 0) {
                const queueInfo = document.createElement('div');
                queueInfo.className = 'queue-info';
                queueInfo.innerHTML = `<strong>Queue Order (oldest to newest):</strong> [${currentStepData.queue.join(', ')}]`;
                stepContainer.appendChild(queueInfo);
            }
        } else {
            // LRU - show last used times
            if (currentStepData.lastUsed && Object.keys(currentStepData.lastUsed).length > 0) {
                const lruInfo = document.createElement('div');
                lruInfo.className = 'queue-info';
                const lastUsedStr = Object.entries(currentStepData.lastUsed)
                    .map(([page, time]) => `Page ${page}: time ${time}`)
                    .join(', ');
                lruInfo.innerHTML = `<strong>Last Used Times:</strong> ${lastUsedStr}`;
                stepContainer.appendChild(lruInfo);
            }
        }

        // Show replaced page info
        if (currentStepData.replacedPage) {
            const replacedInfo = document.createElement('div');
            replacedInfo.className = 'queue-info';
            replacedInfo.style.background = '#f8d7da';
            replacedInfo.style.borderLeft = '4px solid #dc3545';
            replacedInfo.innerHTML = `<strong>Replaced:</strong> Page ${currentStepData.replacedPage}`;
            stepContainer.appendChild(replacedInfo);
        }

        visualization.appendChild(stepContainer);
    }

    // Scroll to bottom to show latest step
    visualization.scrollTop = visualization.scrollHeight;

    // Update navigation buttons
    prevStepBtn.disabled = stepIndex === 0;
    nextStepBtn.disabled = stepIndex === executionSteps.length - 1;
}

// Navigate between steps
function navigateStep(direction) {
    const newStep = currentStep + direction;
    if (newStep >= 0 && newStep < executionSteps.length) {
        displayStep(newStep);
    }
}

// Auto-play functionality
function toggleAutoPlay() {
    if (autoPlayInterval) {
        stopAutoPlay();
    } else {
        startAutoPlay();
    }
}

function startAutoPlay() {
    autoPlayBtn.textContent = 'Pause';
    autoPlayInterval = setInterval(() => {
        if (currentStep < executionSteps.length - 1) {
            navigateStep(1);
        } else {
            stopAutoPlay();
        }
    }, 1500); // 1.5 seconds per step
}

function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
        autoPlayBtn.textContent = 'Auto Play';
    }
}

// Reset everything
function reset() {
    stopAutoPlay();
    currentStep = 0;
    executionSteps = [];
    resultsSection.classList.remove('active');
    stepControls.style.display = 'none';
    visualization.innerHTML = '';
    pageSequenceInput.value = '7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1';
    frameSizeInput.value = '3';
}

