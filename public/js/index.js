const bladeSpacing = 20;
const viewportWidth = window.innerWidth;
const bladeCount = Math.ceil(viewportWidth / bladeSpacing) + 2;

function createBlades(container, className, offset, minHeight, maxHeight, minDur, maxDur) {
    for (let i = 0; i < bladeCount; i++) {
    const blade = document.createElement('div');
    blade.className = className;
    blade.style.left = (i * bladeSpacing + offset) + 'px';
    blade.style.height = (minHeight + Math.random() * (maxHeight - minHeight)) + 'px';
    blade.style.animationDuration = (minDur + Math.random() * (maxDur - minDur)) + 's';
    blade.style.animationDelay = (Math.random() * 5) + 's';
    container.appendChild(blade);
    }
}

createBlades(document.getElementById('grass-front'), 'blade-front', 0, 40, 80, 3, 6);
createBlades(document.getElementById('grass-middle'), 'blade-middle', 10, 30, 60, 4, 8);
createBlades(document.getElementById('grass-back'), 'blade-back', 5, 20, 40, 5, 10);