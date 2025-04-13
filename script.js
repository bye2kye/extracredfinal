document.getElementById('normal-reaction-btn').addEventListener('click', function () {
    document.getElementById('reaction-choice').style.display = 'none';
    document.getElementById('normal-reaction-form').style.display = 'block';
});

document.getElementById('multi-step-reaction-btn').addEventListener('click', function () {
    document.getElementById('reaction-choice').style.display = 'none';
    document.getElementById('multi-step-reaction-form').style.display = 'block';
});

document.getElementById('chemistry-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const reactants = document.getElementById('reactants').value.split(',').map(item => item.trim());
    const products = document.getElementById('products').value.split(',').map(item => item.trim());
    const enthalpyChange = parseFloat(document.getElementById('enthalpy-change').value);

    if (!enthalpyChange || isNaN(enthalpyChange)) {
        alert("Please enter a valid enthalpy change value.");
        return;
    }

    const enthalpyData = generatePotentialEnergyData(reactants, products, enthalpyChange);
    generatePotentialEnergyGraph(enthalpyData, 'potentialEnergyDiagram');
});

document.getElementById('add-step').addEventListener('click', function () {
    const stepContainer = document.createElement('div');
    stepContainer.classList.add('step');

    stepContainer.innerHTML = `
        <label>Reactants:</label>
        <input type="text" class="reactants" required />
        <label>Products:</label>
        <input type="text" class="products" required />
        <label>ΔH (kJ):</label>
        <input type="number" class="enthalpy-change" required />
    `;

    document.getElementById('steps-container').appendChild(stepContainer);
});

document.getElementById('multi-step-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const steps = [];
    const stepElements = document.querySelectorAll('.step');

    stepElements.forEach(step => {
        const reactants = step.querySelector('.reactants').value.split(',').map(item => item.trim());
        const products = step.querySelector('.products').value.split(',').map(item => item.trim());
        const enthalpyChange = parseFloat(step.querySelector('.enthalpy-change').value);

        if (!enthalpyChange || isNaN(enthalpyChange)) {
            alert("Please enter valid enthalpy change values.");
            return;
        }

        steps.push(generatePotentialEnergyData(reactants, products, enthalpyChange));
    });

    const overallEnthalpyChange = parseFloat(document.getElementById('overall-enthalpy-change').value);
    if (!overallEnthalpyChange || isNaN(overallEnthalpyChange)) {
        alert("Please enter a valid overall enthalpy change value.");
        return;
    }

    generateMultiStepPotentialEnergyGraph(steps, overallEnthalpyChange);
});

function generatePotentialEnergyData(reactants, products, deltaH) {
    const isEndothermic = deltaH > 0;

    const reactantEnergy = [0];
    const activatedComplexEnergy = [Math.abs(deltaH) + 50];
    const productEnergy = isEndothermic ? [deltaH] : [0 - Math.abs(deltaH)];

    return {
        reactants: reactants.join(' + '),
        products: products.join(' + '),
        reactantEnergy: reactantEnergy,
        activatedComplexEnergy: activatedComplexEnergy,
        productEnergy: productEnergy,
        isEndothermic: isEndothermic,
        deltaH: Math.abs(deltaH),
    };
}

function generatePotentialEnergyGraph(data, canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    const chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [data.reactants, 'Activated Complex', data.products],
            datasets: [{
                label: `Enthalpy Diagram (${data.isEndothermic ? 'Endothermic' : 'Exothermic'})`,
                data: [
                    ...data.reactantEnergy,
                    ...data.activatedComplexEnergy,
                    ...data.productEnergy
                ],
                borderColor: data.isEndothermic ? 'blue' : 'green',
                pointBackgroundColor: 'black',
                pointRadius: 5,
                pointHoverRadius: 7,
                borderWidth: 3,
                fill: false,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function (context) {
                            return `Ep = ${context.raw} kJ`;
                        }
                    }
                },
                legend: {
                    display: true
                },
                annotation: {
                    annotations: {
                        zeroLine: {
                            type: 'line',
                            yMin: 0,
                            yMax: 0,
                            borderColor: 'black',
                            borderWidth: 2,
                            borderDash: [5, 5],
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Ep (kJ)',
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Reaction Progress',
                    }
                }
            }
        },
        plugins: [Chart.registry.getPlugin('annotation')],
    });

    setTimeout(() => {
        drawDeltaHArrow(data, chartInstance);
    }, 300);
}

function generateMultiStepPotentialEnergyGraph(steps, overallDeltaH) {
    const canvas = document.getElementById('multiStepEnergyDiagram');
    const ctx = canvas.getContext('2d');

    const chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Multi-Step Reaction Enthalpy Diagram',
                data: [],
                borderColor: 'orange',
                pointBackgroundColor: 'black',
                pointRadius: 5,
                pointHoverRadius: 7,
                borderWidth: 3,
                fill: false,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function (context) {
                            return `Ep = ${context.raw} kJ`;
                        }
                    }
                },
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Ep (kJ)',
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Reaction Progress',
                    }
                }
            }
        }
    });

    // Process each step and generate a multi-step diagram
    let lastEndEnergy = 0;
    steps.forEach(step => {
        chartInstance.data.labels.push(step.reactants, 'Activated Complex', step.products);
        chartInstance.data.datasets[0].data.push(...step.reactantEnergy, ...step.activatedComplexEnergy, ...step.productEnergy);

        lastEndEnergy = step.productEnergy[0];
    });

    // Add the overall ΔH
    chartInstance.data.labels.push('Overall ΔH');
    chartInstance.data.datasets[0].data.push(overallDeltaH);

    chartInstance.update();
}

function drawDeltaHArrow(data, chartInstance) {
    const overlayCanvas = document.getElementById('overlayCanvas');
    const ctx = overlayCanvas.getContext('2d');

    if (!chartInstance) return;

    const yScale = chartInstance.scales.y;
    const xScale = chartInstance.scales.x;

    const arrowX = xScale.getPixelForValue(1); // Middle of graph
    const startY = yScale.getPixelForValue(data.reactantEnergy[0]);
    const endY = yScale.getPixelForValue(data.productEnergy[0]);
    const direction = data.isEndothermic ? -1 : 1;

    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    ctx.save();

    // Draw arrow line
    ctx.beginPath();
    ctx.moveTo(arrowX, startY);
    ctx.lineTo(arrowX, endY);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(arrowX, endY);
    ctx.lineTo(arrowX - 5, endY + 10 * direction);
    ctx.lineTo(arrowX + 5, endY + 10 * direction);
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();

    // Draw label
    ctx.font = '16px Arial';
    ctx.fillStyle = 'red';
    ctx.fillText(`ΔH = ${data.deltaH} kJ`, arrowX + 10, (startY + endY) / 2);

    ctx.restore();
}
