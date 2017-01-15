d3.json('../data_temp.json', function(data) {
    var nodesLength = data.nodes.length,
        linksLength = data.links.length;
    console.log('number of nodes: ' + nodesLength);
    console.log('number of links: ' + linksLength);
    // variable
    var WIDTH = window.innerWidth,
        HEIGHT = window.innerHeight,
        DEPTH = window.innerHeight,
        graph = data,
        INTERSECT = {},
        moons = [];

    // cache element
    var $drawerTitle = $(".drawer-title"),
        $drawerBody = $(".drawer-body");
    
    var colorScale = d3.scale.category10();

    // Create scene
    var scene = new THREE.Scene();

    // Add camera
    var fov = 75,
        aspectRatio = WIDTH / HEIGHT,
        camera = new THREE.PerspectiveCamera(fov, aspectRatio, 0.1, 1000);
    camera.position.z = 200;
    scene.add(camera);

    // add nodes
    var nodes = [];
    for (var i = 0; i < nodesLength; i++) {
        var material = new THREE.MeshBasicMaterial({color: colorScale(i)});
        var sphere = new THREE.Mesh(new THREE.SphereGeometry(1), material);
        sphere.userData = graph.nodes[i]
        nodes.push(sphere);
        scene.add(nodes[i]);
    }

    // add edges
    var links = []
    for (var i = 0; i < linksLength; i++) {
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0) );
        var material = new THREE.LineBasicMaterial({linewidth: 1, color: '#cccccc'}),
            line = new THREE.Line(geometry, material);
        line.userData = {
            source: graph.links[i].source,
            target: graph.links[i].target
        }

        sourceIndex = graph.links[i].source;
        var sphere = nodes[sourceIndex];
        sphere.material.color.setHex(0xff7f0e)

        links.push(line);
        scene.add(links[i]);
    };

    // layout controller
    var force = d3.layout.force3d()
        .nodes(graph.nodes)
        .links(graph.links)
        .friction([.80])
        .linkDistance([5])
        .start();

    force.on('tick', function() {
        for (var i = 0; i < nodesLength; i++) {
            var x = graph.nodes[i].x,
                y = graph.nodes[i].y,
                z = graph.nodes[i].z;
            nodes[i].position.set(x, y, z);
            for (var j = 0; j < linksLength; j++) {
                var line = links[j];
                var vi = -1;
                if (line.userData.source == i) {
                    vi = 0;
                };
                if (line.userData.target == i) {
                    vi = 1;
                };
                if (vi >= 0) {
                    line.geometry.vertices[vi].x = x;
                    line.geometry.vertices[vi].y = y;
                    line.geometry.vertices[vi].z = z;
                    line.geometry.verticesNeedUpdate = true;
                };
            };
        };
    });

    // user interaction
    var raycaster = new THREE.Raycaster(),
        mouse = new THREE.Vector2();

    

    var moveToObject = function(objectTarget) {
        // is not activity object?
        if (objectTarget.userData.class != 'Activity') {
            // set angle
            var tweenCamAngle = new TWEEN.Tween(controls.target)
                .to(objectTarget.position, 300)
                .easing(TWEEN.Easing.Linear.None)
                .start();
            // zoom to object
            var dx = (camera.position.x - objectTarget.position.x),
                dy = (camera.position.y - objectTarget.position.y),
                dz = (camera.position.z - objectTarget.position.z),
                dist = Math.sqrt(dx*dx + dy*dy + dz*dz),
                nx = (dx / dist) * 10 + objectTarget.position.x,
                ny = (dy / dist) * 10 + objectTarget.position.y,
                nz = (dz / dist) * 10 + objectTarget.position.z;
            var tweenCamPos = new TWEEN.Tween(camera.position)
                .to({x: nx, y: ny, z: nz}, 300)
                .easing(TWEEN.Easing.Linear.None)
                .start();
        }
    }

    // on mouse click
    var onMouseClick = function(e) {
        var intersects = raycaster.intersectObjects(scene.children);
        // object clicked?
        if(intersects.length > 0) {
            // get object
            INTERSECT = intersects[0].object;
            console.log(INTERSECT);
            // move to selected object
            moveToObject(INTERSECT);
            // add moons
            // moons = [];
            // for (var i  = 0, len = INTERSECT.userData.title.length; i < len; i++) {
            //     var moon = new THREE.Mesh(new THREE.SphereGeometry(1/3));
            //     moon.position.x = INTERSECT.position.x + 5 * Math.sin(2 * Math.PI * moonAttr.angle + i * 30);
            //     moon.position.y = INTERSECT.position.y + 5 * Math.cos(2 * Math.PI * moonAttr.angle + i * 30);
            //     moon.position.z = INTERSECT.position.z;
            //     var moonAttr = {'angle': 0}
            //     var tweenMoon = new TWEEN.Tween(moonAttr)
            //         .to({'angle': 1}, 10000)
            //         .onUpdate(function() {
            //             moon.position.x = INTERSECT.position.x + 5 * Math.sin(2 * Math.PI * moonAttr.angle);
            //             moon.position.y = INTERSECT.position.y + 5 * Math.cos(2 * Math.PI * moonAttr.angle);
            //         })
            //         .easing(TWEEN.Easing.Linear.None)
            //         .start();
            //     moons.push(moon)
            //     scene.add(moon);
            // }

            // update profile
            $drawerTitle.html(INTERSECT.userData.name || INTERSECT.userData.title);
            var drawerContent = "<table class='table'><tbody>";
            for (var key in INTERSECT.userData) {
                drawerContent += '<tr>';
                drawerContent += '<td>' + key + '</td>';
                drawerContent += '<td>' + INTERSECT.userData[key] + '</td>';
                drawerContent += '</tr>';
            }
            drawerContent += '</tbody></table>';
            $drawerBody.html(drawerContent);            
        }
    };
    window.addEventListener('click', onMouseClick, false);

    // on mouse move
    var onMouseMove = function(event) {
        mouse.x = (event.clientX / WIDTH) * 2 - 1;
        mouse.y = (event.clientY / HEIGHT) * -2 + 1;
        raycaster.setFromCamera(mouse, camera);
    }
    window.addEventListener('mousemove', onMouseMove, false);

    // scale node
    var focusNode = function() {
        // scale up focused object
        var intersects = raycaster.intersectObjects(scene.children);
        if (intersects.length > 0 && intersects[0].object !== INTERSECT) {
            INTERSECT = intersects[0].object;
            if (intersects[0].distance > 20) {
                var tweenFocusIn = new TWEEN.Tween(INTERSECT.scale)
                    .to({x: 5, y: 5, z: 5}, 100)
                    .easing(TWEEN.Easing.Linear.None)
                    .start();
            };
        }
        // no focus rescale back
        if (intersects.length == 0 && Object.keys(INTERSECT).length > 0) {
            var tweenFocusOut = new TWEEN.Tween(INTERSECT.scale)
                .to({x: 1, y: 1, z: 1}, 300)
                .easing(TWEEN.Easing.Linear.None)
                .start();
            INTERSECT = {};
        };            
    };


    // Render to html
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(WIDTH, HEIGHT);
    document.body.appendChild(renderer.domElement);
    // add camera controls
    var controls = new THREE.OrbitControls(camera, renderer.domElement);
    // start drawing
    renderCounter = 0; 
    var render = function() {
        // focusNode();
        TWEEN.update();
        controls.update();
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    render();

    // var cameraIntro = {'angle': 0}
    // var tweenIntro = new TWEEN.Tween(cameraIntro)
    //     .to({'angle': 0.01 * Math.PI}, 10000)
    //     .onUpdate(function() {
    //         camera.position.z = 200 * Math.cos(2 * Math.PI * cameraIntro.angle);
    //         camera.position.x = 200 * Math.sin(2 * Math.PI * cameraIntro.angle);
    //         camera.position.y = 200 * Math.sin(1 * Math.PI * cameraIntro.angle + Math.PI);
    //     })
    //     .easing(TWEEN.Easing.Cubic.InOut)
    //     .start();
});
