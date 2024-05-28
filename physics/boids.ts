import * as THREE from "three";

export default class Boid {
    pos: THREE.Vector3;
    speed: THREE.Vector3;
    acc = new THREE.Vector3(0, 0, 0);
    id: number;
    mesh: THREE.Mesh

    constructor(pos: THREE.Vector3, speed: THREE.Vector3, mesh: THREE.Mesh, id: number) {
        this.pos = pos;
        this.speed = speed;
        this.id = id;
        this.mesh = mesh;
    }

    separation(boids: Boid[], coef: number = 1) {
        let steer = new THREE.Vector3(0, 0, 0);
        let count = 0;
        for (let boid of boids) {
            let d = this.pos.distanceTo(boid.pos);
            if (d > 0) {
                let diff = this.pos.clone().sub(boid.pos);
                diff.normalize();
                diff.divideScalar(d);
                steer.add(diff);
                count++;
            }
        }
        if (count > 0) {
            steer.divideScalar(count);
        }
        if (steer.length() > 0) {
            steer.normalize();
            steer.multiplyScalar(this.speed.length());
            steer.sub(this.speed);
        }
        steer.multiplyScalar(coef);
        return steer;
    }

    alignment(boids: Boid[], coef: number = 1) {
        let steer = new THREE.Vector3(0, 0, 0);
        let count = 0;
        for (let boid of boids) {
            steer.add(boid.speed);
            count++;
        }
        if (count > 0) {
            steer.divideScalar(count);
        }
        steer.multiplyScalar(coef);
        return steer;
    }

    cohesion(boids: Boid[], coef: number = 1) {
        let steer = new THREE.Vector3(0, 0, 0);
        let count = 0;
        for (let boid of boids) {
            steer.add(boid.pos);
            count++;
        }
        if (count > 0) {
            steer.divideScalar(count);
            steer.sub(this.pos);
        }
        steer.multiplyScalar(coef);
        return steer;
    }

    update(boids: Boid[], maxSpeed: number, coefs: { sepCoef: number, aliCoef: number, cohCoef: number }) {
        let sep = this.separation(boids, coefs.sepCoef);
        let ali = this.alignment(boids, coefs.aliCoef);
        let coh = this.cohesion(boids, coefs.cohCoef);

        this.acc.add(sep);
        this.acc.add(ali);
        this.acc.add(coh);

        this.speed.add(this.acc);
        this.speed.clampLength(0, maxSpeed);
        this.pos.add(this.speed);

        this.acc.set(0, 0, 0);

        this.mesh.position.copy(this.pos);
    }
}