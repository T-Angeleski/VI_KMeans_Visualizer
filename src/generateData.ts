const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

const clusterCount = document.getElementById("clusterCount") as HTMLInputElement;
const kAmount = document.getElementById("kAmount") as HTMLInputElement;
const algorithmStatus = document.getElementById("status") as HTMLElement;

let isDrawing = false;
let canDraw = false;
let drawnPoints: Point[][] = []; // Points from drawing
let generatedPoints: Point[][] | null = []; // Points from other options
let selectedData: string | null = null;
let isAlgorithmActive = false;

// -----------
type Point = {
    x: number;
    y: number;
};

type DataGenerator = () => Point[][];



// KMEANS ALGORITHM
/**
 * Begin the algorithm
 * @param K : how many means to divide data
 * @param maxIter: how many iterations
 */
function setupAlgorithm() {
    if (selectedData == null) {
        alert("Please select a data type");
        return;
    }

    const K = parseInt(kAmount.value);
    const maxIter = 100;
    
    if (selectedData === 'drawn') {
        if (drawnPoints.length === 0) {
            alert("Please draw data first.");
            return;
        }
        beginKMeans(K, maxIter, drawnPoints);
    } else {
        let dataToUse: Point[][];

        if (generatedPoints != null && generatedPoints.length > 0) {
            dataToUse = generatedPoints;
        } else {
            dataToUse = handleDataClick(selectedData);
        }

        beginKMeans(K, maxIter, dataToUse);
    }
}

function beginKMeans(k: number, maxIterations: number, data: Point[][]) {

    isAlgorithmActive = true;
    let iter = 0;
    let centroids: Point[] = generateRandomCentroids(k);  // Randomly initialize the centroids
    
    let clusters: Point[][] = new Array(k).fill([]) // Initialize empty clusters
        .map(() => []);


    // Update centroids untill convergence or max iters
    let interval = setInterval(() => {
        algorithmStatus.innerHTML = `Currently running, on iteration ${iter+1}`;
        
        clusters = assignPointsToClusters(data, centroids);

        const prevCentroids = [...centroids] // Save previous for convergence check

        centroids = computeCentroids(clusters);
        
        // Visualize current centroids
        clearCanvas();
        clusters.forEach((cluster, index) => {
            cluster.forEach(point => {
                drawPoint(point, `hsl(${index * 360 / k}, 100%, 50%)`);
            })
        })
        centroids.forEach(centroid => {
            drawPoint(centroid, 'black', 6)
            console.log(centroid);
            
        })


        iter++;
        // Check for convergence or maximum iterations
        if (areCentroidsConverged(prevCentroids, centroids) || iter >= maxIterations) {
            clearInterval(interval);
            isAlgorithmActive = false;
            generatedPoints = [];
            algorithmStatus.innerHTML = "Algorithm converged or reached maximum iterations.";
        }
    }, 500) // every 500 ms
}

/**
 * Assign points to clusters based on centroids
 * @param data: data points
 * @param centroids: current centroids
 * @returns clusters: array of clusters
 */
function assignPointsToClusters(data: Point[][], centroids: Point[]): Point[][] {
    let clusters: Point[][] = new Array(centroids.length).fill([]).map(() => []);

    data.forEach(cluster => {
        cluster.forEach(point => {
            let closestCentroidIndex = findClosestCentroid(point, centroids);
            clusters[closestCentroidIndex].push(point);
        })
    })

    return clusters;
}

/**
 * Find the index of the closest centroid to a given point
 * @param point: point to be compared
 * @param centroids: array of centroids
 * @returns index of the closest centroid
 */
function findClosestCentroid(point: Point, centroids: Point[]): number {
    let minDist = Infinity;
    let closestIndex = -1;

    centroids.forEach((centroid, index) => {
        let dist = computeDistance(point, centroid);
        if (dist < minDist) {
            minDist = dist;
            closestIndex = index;
        }
    });

    return closestIndex;
}
/**
 * Compute the distance between two points
 * @param p1: first point
 * @param p2: second point
 * @returns distance between the points
 */
function computeDistance(p1: Point, p2: Point) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * Compute the centroids based on the clusters
 * @param clusters: array of clusters
 * @returns array of centroids
 */
function computeCentroids(clusters: Point[][]): Point[] {
    let centroids: Point[] = [];

    clusters.forEach(cluster => {
        if(cluster.length == 0) {
            return; // Empty cluster, remain unchanged
        }

        let sumX = 0;
        let sumY = 0;

        cluster.forEach(point => {
            sumX += point.x;
            sumY += point.y;
        })

        let centroidX = sumX / cluster.length;
        let centroidY = sumY / cluster.length;

        centroids.push({ x: centroidX, y: centroidY })
    })

    return centroids;
}
/**
 * @param prev Previous centroid iteration
 * @param current Current centroids
 * @returns True/False if no changes are made
 */
function areCentroidsConverged(prev: Point[], current: Point[]): boolean {
    const tolerance = 1e-5;

    return prev.every((centroid, index) => {
        // return centroid.x === current[index].x && centroid.y === current[index].y;
        return computeDistance(centroid, current[index]) < tolerance;
    })
}

function drawPoint(point: Point, color: string, size: number = 3) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
    ctx.fill();
}

// EVENT LISTENERS
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

document.addEventListener('DOMContentLoaded', function () {
    const radioButtons = document.getElementsByName('data');
    radioButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            let button = btn as HTMLInputElement
            selectedData = button.value;
            drawSelectedData(selectedData);
        });
    });
});

// ------------
function drawSelectedData(selectedData: string | null) {
    if (selectedData === 'drawn') {
        clearCanvas();
        enableDrawing();
    } else {
        disableDrawing();
        handleDataClick(selectedData!);
    }
}

function handleDataClick(dataType: string): Point[][] {
    let dataGenerator: DataGenerator;
    let data: Point[][];

    if (dataType == "random") {
        dataGenerator = generateCentroidRandomDataset;
    } else if (dataType == "mickey") {
        dataGenerator = generateMickeyDataset;
    } else {
        dataGenerator = generateCompletelyRandomDataset;
    }

    data = dataGenerator()
    if (dataType !== "drawn") {
        generatedPoints = data;
    }

    return data;
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
    const clusterAmount = parseInt(clusterCount.value);

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
    const centerAmount = 1500;
    const earRadius = 80;
    const earAmount = 200;

    const center: Point = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
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
    const numPoints = 1500;

    for (let i = 0; i < numPoints; i++) {
        const point: Point = {
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT
        }

        point.x += Math.random() - 0.5
        point.y += Math.random() - 0.5  // Random spread

        data.push([point])
    }

    return data;

}

/**
 * Generate random initial centroids for k-means algorithm
 * @param k: number of centroids
 * @returns array of random centroids
 */
function generateRandomCentroids(k: number): Point[] {
    const centroids: Point[] = [];
    const minDistance = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5; // Minimum distance between centroids

    for (let i = 0; i < k; i++) {
        let newCentroid: Point;

        // Ensure each centroid is at least minDistance away from existing centroids
        do {
            newCentroid = {
                x: Math.floor(Math.random() * CANVAS_WIDTH),
                y: Math.floor(Math.random() * CANVAS_HEIGHT),
            };
        } while (
            centroids.some(
                (centroid) => computeDistance(newCentroid, centroid) < minDistance
            )
        );

        centroids.push(newCentroid);
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
        const clampedX = Math.min(CANVAS_WIDTH, Math.max(0, x));
        const clampedY = Math.min(CANVAS_HEIGHT, Math.max(0, y));

        points.push({ x: clampedX, y: clampedY });
    }

    return points;
}


function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.border = "3px solid black"
    drawnPoints = [];

    if(isAlgorithmActive) {
        isAlgorithmActive = false;
    }
}

// Drawing

function enableDrawing() {
    canDraw = true;
    canvas.style.border = "4px dotted green"
}

function disableDrawing() {
    canDraw = false;
    canvas.style.border = "3px solid black"
}

function toggleDrawing() {
    canDraw = !canDraw

    if (canDraw) {
        canvas.style.border = "3px dotted green"
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

        drawnPoints.push([point]);
    }
}

