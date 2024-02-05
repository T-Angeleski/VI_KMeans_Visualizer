const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

let isDrawing = false;
let canDraw = false;
let drawnPoints: Point[] = [];

// -----------
type Point = {
    x: number;
    y: number;
};

type DataGenerator = () => Point[][];

// ------------
canvas.addEventListener("mousedown", () => {
    isDrawing = true
});
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", () => {
    isDrawing = false;
});
canvas.addEventListener("mouseout", () => {
    isDrawing = false;
});

// ------------
function handleDataClick(dataType: string): Point[][] {
    let dataGenerator: DataGenerator;

    if (dataType == "random") {
        dataGenerator = generateCentroidRandomDataset;
    } else if (dataType == "mickey") {
        dataGenerator = generateMickeyDataset;
    } else {
        dataGenerator = generateCompletelyRandomDataset;
    }

    return displayData(dataGenerator);
}

function displayData(dataGenerator: DataGenerator): Point[][] {
    const data: Point[][] = dataGenerator();
    clearCanvas();
    data.forEach((cluster) => {
        cluster.forEach((point) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    });

    return data;
}

/**
 Generate N random "clusters" of 2D data
 */
function generateCentroidRandomDataset(): Point[][] {
    const data: Point[][] = [];
    const radius = 75; // Cluster size
    const amount = 250; // How many points in cluster
    const clusterAmount = 3;

    const centroids: Point[] = generateRandomCentroids(clusterAmount);

    centroids.forEach((centroid: Point) => {
        const points: Point[] = generatePointsInCluster(amount, centroid, radius);
        data.push(points);
    })

    return data;
}

/**
 * Generate data in the form of Mickey Mouse
 * @returns data: Array of points
 */
function generateMickeyDataset(): Point[][] {
    const data: Point[][] = [];
    const centerRadius = 200;
    const centerAmount = 750;
    const earRadius = 80;
    const earAmount = 100;

    const center: Point = { x: canvasWidth / 2, y: canvasHeight / 2 }
    const centerPoints = generatePointsInCluster(centerAmount, center, centerRadius);

    const leftEar: Point = {
        x: center.x - centerRadius * 0.8,
        y: center.y - centerRadius * 0.8
    }
    const rightEar: Point = {
        x: center.x + centerRadius * 0.8,
        y: center.y - centerRadius * 0.8
    }

    const leftPoints = generatePointsInCluster(earAmount, leftEar, earRadius);
    const rightPoints = generatePointsInCluster(earAmount, rightEar, earRadius);

    data.push(centerPoints, leftPoints, rightPoints);

    return data;
}

function generateCompletelyRandomDataset(): Point[][] {
    const data: Point[][] = []
    const numPoints = 500;

    for (let i = 0; i < numPoints; i++) {
        const point: Point = {
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight
        }

        point.x += Math.random() - 0.5
        point.y += Math.random() - 0.5  // Random spread

        data.push([point])
    }

    return data;

}

function generateRandomCentroids(numClusters: number): Point[] {
    const centroids: Point[] = []
    for (let i = 0; i < numClusters; i++) {
        const centroid: Point = {
            x: Math.floor(Math.random() * canvasWidth),
            y: Math.floor(Math.random() * canvasHeight),
        }

        centroids.push(centroid);
    }

    return centroids;
}

function generatePointsInCluster(
    amount: number,
    centroid: Point,
    radius: number
): Point[] {
    const points: Point[] = [];

    for (var i = 0; i < amount; i++) {

        const angle = Math.random() * 2 * Math.PI // Generate random angle [0, 2pi];
        const r = Math.sqrt(Math.random()) * radius // scale radius [0, radius];

        // Convert polar coordinates to Cartesian coordinates
        const x = centroid.x + r * Math.cos(angle);
        const y = centroid.y + r * Math.sin(angle);

        // Clamp coordinates to fit within canvas bounds
        const clampedX = Math.min(canvasWidth, Math.max(0, x));
        const clampedY = Math.min(canvasHeight, Math.max(0, y));

        points.push({ x: clampedX, y: clampedY });
    }

    return points;
}


function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.border = "1px solid black"
    drawnPoints = [];
}

// Drawing
function toggleDrawing() {
    canDraw = !canDraw

    if (canDraw) {
        canvas.style.border = "1px solid green"
    } else {
        canvas.style.border = "1px solid black"
    }
}

function draw(event: MouseEvent) {
    if (!isDrawing) return;
    if (!canDraw) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    for (let i = 0; i < Math.random() * 5; i++) {
        const offsetX = (Math.random() - 0.5) * 50;
        const offsetY = (Math.random() - 0.5) * 50;
        const point: Point = { x: x + offsetX, y: y + offsetY };

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();

        drawnPoints.push(point);
    }
}
