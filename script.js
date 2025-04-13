document.getElementById('chemistry-form').addEventListener('submit', function (e) {
    e.preventDefault();

    // Check if it's multi-step or normal reaction
    const isMultiStep = window.location.pathname.includes('multistep.html');
    
    if (isMultiStep) {
        handleMultiStepReaction();
    } else {
        handleNormalReaction();
    }
});

function handleNormalReaction() {
    const reactants = document.getElementById('reactants').value.split(',').map(item => item.trim());
    const products = document.getElementById('products').value.split(',').map(item => item.trim());
    const enthalpyChange = parseFloat(document.getElementById('enthalpy-change').value);

    if (!enthalpyChange || isNaN(enthalpyChange)) {
        alert("Please enter a valid enthalpy change value.");
        return;
    }

    const enthalpyData = generatePotentialEnergyData(reactants, products, enthalpyChange);
    generatePotentialEnergyGraph(enthalpyData);
}

function handleMultiStepReaction() {
    const steps = [];
    const stepElements = document.querySelectorAll('.step');

    stepElements.forEach(step => {
        const reactants = step.querySelector('.reactants').value.split(',').map(item => item.trim());
        const products = step.querySelector('.products').value.split(',').map(item => item.trim());
        const enthalpyChange = parseFloat(step.querySelector('.enthalpy-change').value);

        if (!enthalpyChange || isNaN(enthalpyChange)) {
            alert("Please enter a valid enthalpy change value for all steps.");
            return;
        }

        steps.push({
            reactants: reactants,
            products: products,
            deltaH: enthalpyChange
        });
    });

    const multiStepData = generateMultiStepData(steps);
    generateMultiStepEnergyGraph(multiStepData);
}

function generateMultiStepData(steps) {
    let accumulatedEnergy = 0;
    const stepData = [];

    steps.forEach((step, index) => {
        const isEndothermic = step.deltaH > 0;
        const reactantEnergy = [accumulatedEnergy];
        accumulatedEnergy += Math.abs(step.deltaH);
        const activatedComplexEnergy = [accumulatedEnergy + 50];
        const productEnergy = isEndothermic ? [accumulatedEnergy + step.deltaH] : [accumulatedEnergy - Math.abs(step.deltaH)];
        
        stepData.push({
            reactants: step.reactants.join(' + '),
            products: step.products.join(' + '),
            reactantEnergy: reactantEnergy,
            activatedComplexEnergy: activatedComplexEnergy,
            productEnergy: productEnergy,
            isEndothermic: isEndothermic,
            deltaH: Math.abs(step.deltaH),
        });
    });

    return stepData;
}

function generateMultiStepEnergyGraph(data) {
    const canvas = document.getElementById('potentialEnergyDiagram');
    const ctx = canvas.getContext('2d');
    const overlayCanvas = document.getElementById('overlayCanvas');
    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;

    if (chartInstance) {
        chartInstance.destroy();
    }

    const labels = [];
    const datasets = data.map(d => {
        labels.push(d.reactants, 'Activated Complex', d.products);
        return {
            label: `Step Enthalpy Diagram (${d.isEndothermic ? 'Endothermic' : 'Exothermic'})`,
            data: [
                ...d.reactantEnergy,
                ...d.activatedComplexEnergy,
                ...d.productEnergy
            ],
            borderColor: d.isEndothermic ? 'blue' : 'green',
            pointBackgroundColor: 'black',
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 3,
            fill: false,
            tension: 0.4,
        };
    });

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    title: { display: true, text: 'Ep (kJ)' }
                },
                x: {
                    title: { display: true, text: 'Reaction Progress' }
                }
            }
        },
    });

    setTimeout(() => {
        drawDeltaHArrow(data);
    }, 300);
}

function drawDeltaHArrow(data) {
    const overlayCanvas = document.getElementById('overlayCanvas');
    const ctx = overlayCanvas.getContext('2d');
    const yScale = chartInstance.scales.y;
    const xScale = chartInstance.scales.x;

    data.forEach((d, index) => {
        const arrowX = xScale.getPixelForValue(index + 1);
        const startY = yScale.getPixelForValue(d.reactantEnergy[0]);
        const endY = yScale.getPixelForValue(d.productEnergy[0]);
        const direction = d.isEndothermic ? -1 : 1;

        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        ctx.save();

        ctx.beginPath();
        ctx.moveTo(arrowX, startY);
        ctx.lineTo(arrowX, endY);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(arrowX, endY);
        ctx.lineTo(arrowX - 5, endY + 10 * direction);
        ctx.lineTo(arrowX + 5, endY + 10 * direction);
        ctx.closePath();
        ctx.fillStyle = 'red';
        ctx.fill();

        ctx.font = '16px Arial';
        ctx.fillStyle = 'red';
        ctx.fillText(`ΔH = ${d.deltaH} kJ`, arrowX + 10, (startY + endY) / 2);

        ctx.restore();
    });
}
