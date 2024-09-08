'use strict';

(function () {
    document.addEventListener('DOMContentLoaded', () => {
        setup();
        createDataBase();
        document.querySelector('.box').prepend(tile.create());
        document.getElementById('start_game').classList.add('show-button');
    });

    let dataBase,
        stopwatch,
        count = 0,
        gameStart = false,
        map = initialization(4),
        empty = {
            row: map.length - 1,
            col: map.length - 1
        },
        grid = {
            side: map.length,
            shuffleMap(shuffleTiles) {
                // for (let mixing = 0; mixing < 2; mixing++) {
                for (let mixing = 0; mixing < this.side * 100; mixing++) {
                    let i = 0,
                        into = [];
                    if (empty.row - 1 >= 0)
                        into[i++] = { row: empty.row - 1, col: empty.col };
                    if (empty.col + 1 < grid.side)
                        into[i++] = { row: empty.row, col: empty.col + 1 };
                    if (empty.row + 1 < grid.side)
                        into[i++] = { row: empty.row + 1, col: empty.col };
                    if (empty.col - 1 >= 0)
                        into[i++] = { row: empty.row, col: empty.col - 1 };
                    i = Math.floor(Math.random() * into.length);
                    [map[into[i].row][into[i].col], map[empty.row][empty.col]] = [map[empty.row][empty.col], map[into[i].row][into[i].col]];
                    [empty] = [into[i]];
                }
                shuffleTiles();
            },
            shuffleTiles() {
                let tiles = document.querySelectorAll('.tile'),
                    from = [];
                for (let i = 0; i < tiles.length; i++) {
                    let matrix = new WebKitCSSMatrix(getComputedStyle(tiles[i]).transform);
                    from[i] = {
                        row: matrix.m42 / tile.side,
                        col: matrix.m41 / tile.side
                    }
                }
                for (let row = 0; row < grid.side; row++) {
                    for (let col = 0; col < grid.side; col++) {
                        if (!map[row][col]) continue;
                        if (from[map[row][col] - 1].row != row || from[map[row][col] - 1].col != col) {
                            tile.animateMove({
                                duration: 250,
                                timing: progress => -(Math.cos(Math.PI * progress) - 1) / 2,
                                draw: progress => {
                                    let y = tile.side * (from[map[row][col] - 1].row + progress * (row - from[map[row][col] - 1].row)),
                                        x = tile.side * (from[map[row][col] - 1].col + progress * (col - from[map[row][col] - 1].col));
                                    tiles[map[row][col] - 1].style.transform = `translate(${x}px,${y}px)`;
                                }
                            });
                        }
                    }
                }
            }
        },
        tile = {
            side: 100,
            create() {
                let container = document.querySelector('.grid');
                for (let row = 0, number = 1; row < grid.side; row++) {
                    for (let col = 0; col < grid.side; col++) {
                        let tile = document.createElement('div'),
                            content = `<div class="rectangle"></div><div class="circle">${number++}</div>`;
                        tile.className = 'tile';
                        tile.style.width = tile.style.height = `${this.side}px`;
                        tile.insertAdjacentHTML('beforeend', content);
                        tile.style.transform = `translate(${col * this.side}px,${row * this.side}px)`;
                        tile.addEventListener('click', this.move(() => {
                            for (let row = 0, number = 1; row < map.length; row++) {
                                for (let col = 0; col < map.length; col++) {
                                    if (map[row][col] === number) {
                                        number++;
                                        if (number === map.length ** 2) {
                                            let move = document.getElementById('move'),
                                                time = document.getElementById('time'),
                                                labels = document.querySelectorAll('label');
                                            if (move.checked || time.checked) {
                                                if (stopwatch)
                                                    clearInterval(stopwatch);
                                                addToStorage(createGameData(new Date(),
                                                    move.checked ? count : '&mdash;',
                                                    time.checked ? document.getElementById('time_info').textContent : '&mdash;'));
                                            }
                                            gameStart = false;
                                            document.getElementById('start_game').classList.add('show-button');
                                            document.querySelector('.grid').classList.remove('onfocus');
                                            document.getElementById('default').classList.remove('disable-button');
                                            document.querySelector('.settings-warning').style.display = 'block';
                                            for (let i = 0; i < 2; i++)
                                                labels[i].classList.remove('disable');
                                            return;
                                        }
                                    } else return;
                                }
                            }
                        }));
                        container.append(tile);
                        if (number === grid.side ** 2) {
                            container.style.width = container.style.height = `${grid.side * this.side}px`;
                            return container;
                        }
                    }
                }
            },
            move(compleed) {
                return function () {
                    let matrix = new WebKitCSSMatrix(getComputedStyle(this).transform),
                        target = {
                            row: matrix.m42 / tile.side,
                            col: matrix.m41 / tile.side
                        };
                    if (Math.abs(target.row - empty.row) + Math.abs(target.col - empty.col) === 1) {
                        [map[target.row][target.col], map[empty.row][empty.col]] = [map[empty.row][empty.col], map[target.row][target.col]];
                        [empty, target] = [target, empty];
                        if (document.getElementById('move').checked)
                            document.getElementById('move_info').innerText = `${++count}`;
                        tile.animateMove({
                            duration: 150,
                            timing: progress => 1 - Math.pow(1 - progress, 3),
                            draw: progress => {
                                let y = tile.side * (empty.row + progress * (target.row - empty.row)),
                                    x = tile.side * (empty.col + progress * (target.col - empty.col));
                                this.style.transform = `translate(${x}px,${y}px)`;
                            }
                        });
                        if (document.getElementById('sound').checked) {
                            let sound = new Audio('resources/click.mp3').play();
                        }
                        compleed();
                    }
                }
            },
            animateMove({ duration, timing, draw }) {
                let startTime = null,
                    animate = currentTime => {
                        if (!startTime)
                            startTime = currentTime;
                        let progress = (currentTime - startTime) / duration;
                        progress > 1 ? progress = 1 : requestAnimationFrame(animate);
                        draw(timing(progress));
                    };
                requestAnimationFrame(animate);
            }
        };

    function initialization(side) {
        let map = [];
        for (let row = 0, number = 1; row < side; row++) {
            map[row] = new Uint8Array(side);
            for (let col = 0; col < side; col++) {
                map[row][col] = number++;
                if (number === side ** 2) {
                    map[side - 1][side - 1] = 0;
                    return map;
                }
            }
        }
    }

    function setup() {
        let checkboxes = document.querySelectorAll('.checkbox');
        if (!localStorage.length) {
            for (let checkbox of checkboxes) {
                localStorage.setItem(checkbox.id, 'false');
                if (checkbox.id == 'sound')
                    localStorage.setItem(checkbox.id, 'true');
            }
        }
        for (let checkbox of checkboxes) {
            if (localStorage.getItem(checkbox.id) == 'true') {
                checkbox.checked = true;
                changeSetup(checkboxes, checkbox.id, true);
            } else checkbox.checked = false;
            checkbox.addEventListener('change', (event) => {
                event.target.checked ? localStorage.setItem(event.target.id, 'true') : localStorage.setItem(event.target.id, 'false');
                changeSetup(checkboxes, event.target.id);
                if (event.target.id === 'move' && !checkboxes[0].checked)
                    document.getElementById('move_info').textContent = '0';
                else if (event.target.id === 'time' && !checkboxes[1].checked)
                    document.getElementById('time_info').textContent = '00:00';
            });
        }
    }

    function changeSetup(checkboxes, id, setup = false) {
        let panel = document.querySelector('.info-panel');
        switch (id) {
            case 'move':
            case 'time':
                if (checkboxes[0].checked && !checkboxes[1].checked) {
                    id == 'move' ?
                        panel.classList.remove('add-0', 'hidden-panel') :
                        panel.className = panel.className.replace(/ add-\d/g, '').concat(' add-4');
                } else if (!checkboxes[0].checked && checkboxes[1].checked) {
                    id == 'move' ?
                        panel.className = panel.className.replace(/ add-\d/g, '') :
                        panel.classList.remove('hidden-panel', 'add-4');
                    panel.classList.add('add-0');
                } else if (checkboxes[0].checked && checkboxes[1].checked) {
                    if (setup) {
                        panel.classList.add('add-2');
                        return;
                    }
                    id == 'move' ?
                        panel.classList.add('add-3') :
                        panel.classList.add('add-1');
                } else panel.classList.add('hidden-panel');
                break;
            case 'sound': // ON/OFF sound
        }
    }

    function createDataBase() {
        let openRequest = indexedDB.open('statistics', 1);
        openRequest.onupgradeneeded = event => event.target.result.createObjectStore('history');
        openRequest.onsuccess = event => dataBase = event.target.result;
        openRequest.onerror = () => console.log('ERROR: ', openRequest.error);
    }

    function addToStorage(value) {
        let transaction = dataBase.transaction('history'),
            storage = transaction.objectStore('history'),
            history = storage.getAll(IDBKeyRange.bound(0, 7)),
            best = storage.getAll(IDBKeyRange.bound(10, 11));
        history.onsuccess = () => {
            let dataArray = history.result;
            if (dataArray.length < 8)
                saveValue([value], dataArray.length);
            else {
                dataArray.shift();
                dataArray.push(value);
                saveValue(dataArray, 0);
            }
        }
        best.onsuccess = () => {
            let dataArray = best.result;
            if (!dataArray.length) {
                if (value.move === '&mdash;')
                    dataArray.push(value, { date: '', move: '', time: '' });
                else dataArray.push({ date: '', move: '', time: '' }, value);
            } else {
                let valueTime = new Date('0 ' + value.time),
                    dataTime = new Date('0 ' + (dataArray[0].time || dataArray[1].time));
                if (value.move <= dataArray[1].move && valueTime <= dataTime) {
                    dataArray[0] = { date: '', move: '', time: '' };
                    dataArray[1] = value;
                } else if (value.move < dataArray[1].move) {
                    if (dataArray[0].move || dataArray[1].time === '&mdash;')
                        dataArray[1] = value;
                    else {
                        dataArray[0] = dataArray[1];
                        dataArray[1] = value;
                    }
                } else if (valueTime < dataTime) {
                    dataArray[0] = value;
                } else if (!dataArray[1].move && value.move !== '&mdash;') {
                    dataArray[1] = value;
                } else if (!dataArray[0].time && value.time !== '&mdash;') {
                    dataArray[0] = value;
                }
            }
            saveValue(dataArray, 10);
        }
    }

    function saveValue(value, key) {
        let transaction = dataBase.transaction('history', 'readwrite'),
            storage = transaction.objectStore('history'),
            i = 0;
        do {
            storage.put(value[i++], key++);
        } while (i < value.length);
    }

    function createGameData(date, move, time) {
        let day = date.getDate().toString().padStart(2, '0'),
            month = date.getMonth().toString().padStart(2, '0'),
            hours = date.getHours().toString().padStart(2, '0'),
            minutes = date.getMinutes().toString().padStart(2, '0');
        return {
            date: `${day}.${month}.${date.getFullYear()}&emsp;${hours}:${minutes}`,
            move: move,
            time: time
        }
    }

    function interval(minutes = 0, seconds = 1) {
        return setInterval(() => {
            if (seconds === 60) {
                seconds = 0;
                minutes++;
            }
            time_info.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            seconds++;
        }, 1000);
    }

    function startGame() {
        if (document.getElementById('move').checked) {
            count = 0;
            document.getElementById('move_info').innerText = '0';
        }
        if (document.getElementById('time').checked) {
            if (stopwatch)
                clearInterval(stopwatch);
            document.getElementById('time_info').innerText = '00:00';
            stopwatch = interval();
        }
        if (document.getElementById('sound').checked) {
            let sound = new Audio('resources/mixing.mp3').play();
        }
        grid.shuffleMap(grid.shuffleTiles);
        gameStart = true;
    }

    document.getElementById('menu_button').addEventListener('click', () => {
        if (!gameStart)
            document.getElementById('start_game').classList.remove('show-button');
        else document.querySelector('.grid').classList.remove('onfocus');
        if (stopwatch)
            clearInterval(stopwatch);
        document.getElementById('menu_button').classList.add('hidden-panel');
        document.querySelector('.menu').classList.add('show-menu');
    });

    document.getElementById('start_game').addEventListener('click', () => {
        startGame();
        setTimeout(() => {
            document.getElementById('start_game').classList.remove('show-button');
            document.querySelector('.grid').classList.add('onfocus');
        }, 100);
    });

    document.getElementById('new_game').addEventListener('click', () => {
        startGame();
        setTimeout(() => {
            document.querySelector('.menu').classList.remove('show-menu');
            document.querySelector('.grid').classList.add('onfocus');
            menu_button.classList.remove('hidden-panel');
        }, 100);
    });

    document.getElementById('statistic').addEventListener('click', () => {
        let table = document.querySelector('.history'),
            transaction = dataBase.transaction('history', 'readonly'),
            storage = transaction.objectStore('history'),
            data = storage.getAll(),
            best = storage.getAll(IDBKeyRange.bound(10, 11));
        data.onsuccess = () => {
            let dataArray = data.result;
            if (dataArray.length) {
                if (!table.children.length) {
                    let tbody = document.createElement('tbody');
                    for (let row = 0; row < 10; row++) {
                        let tr = document.createElement('tr');
                        for (let col = 0; col < 3; col++)
                            tr.insertAdjacentElement('beforeend', document.createElement('td'));
                        tbody.insertAdjacentElement('beforeend', tr);
                    }
                    table.append(tbody);
                }
                for (let row = 1; row <= dataArray.length; row++) {
                    let tr = table.querySelector(`tr:nth-child(${row})`);
                    for (let col = 1, key = 0; col <= 3; col++)
                        tr.querySelector(`td:nth-child(${col})`).innerHTML = Object.values(dataArray[dataArray.length - row])[key++];
                }
                document.querySelector('.statistics-warning').style.display = 'none';
                document.querySelector('.statistics-info').style.display = 'block';
                best.onsuccess = () => {
                    let dataArray = best.result,
                        table = document.querySelector('.history'),
                        tr1 = table.querySelector('tr:nth-child(1)'),
                        tr2 = table.querySelector('tr:nth-child(2)');
                    if (!dataArray[0].time) {
                        if (dataArray[1].time === '&mdash;')
                            tr1.querySelector('td:nth-child(2)').classList.add('dot');
                        else {
                            tr1.querySelector('td:nth-child(2)').classList.add('dot');
                            tr1.querySelector('td:nth-child(3)').classList.add('dot');
                        }
                        tr2.querySelector('td:nth-child(3)').classList.remove('dot');
                    } else {
                        if (dataArray[1].move) {
                            tr1.querySelector('td:nth-child(2)').classList.add('dot');
                            tr2.querySelector('td:nth-child(3)').classList.add('dot');
                        } else
                            tr2.querySelector('td:nth-child(3)').classList.add('dot');
                        tr1.querySelector('td:nth-child(3)').classList.remove('dot');
                    }
                }
            } else document.querySelector('.statistics-info').style.display = 'none';
        }
        setTimeout(() => {
            document.querySelector('.menu-items').classList.add('hidden');
            document.querySelector('.statistics').classList.add('show');
        }, 100);
    });

    document.getElementById('back_statistics').addEventListener('click', () => {
        setTimeout(() => {
            document.querySelector('.statistics').classList.remove('show');
            document.querySelector('.menu-items').classList.remove('hidden');
        }, 100);
    });

    document.getElementById('reset').addEventListener('click', () => {
        if (document.querySelector('table').children.length) {
            let transaction = dataBase.transaction('history', 'readwrite'),
                storage = transaction.objectStore('history');
            storage.clear();
            document.querySelector('tbody').remove();
            document.querySelector('.statistics-warning').style.display = 'block';
            document.querySelector('.statistics-info').style.display = 'none';
        }
    });

    document.getElementById('settings').addEventListener('click', () => {
        let panel = document.querySelector('.info-panel');
        if (gameStart) {
            let labels = document.querySelectorAll('label');
            document.querySelector('.settings-warning').style.display = 'block';
            document.getElementById('default').classList.add('disable-button');
            for (let i = 0; i < 2; i++)
                labels[i].classList.add('disable');
        } else
            document.querySelector('.settings-warning').style.display = 'none';
        if (!panel.classList.contains('smooth-panel')) {
            panel.classList.add('smooth-panel');
            document.querySelector('.time').classList.add('smooth-shift');
        }
        setTimeout(() => {
            document.querySelector('.menu-items').classList.add('hidden');
            document.querySelector('.settings').classList.add('show');
        }, 100);
    });

    document.getElementById('back_settings').addEventListener('click', () => {
        setTimeout(() => {
            document.querySelector('.settings').classList.remove('show');
            document.querySelector('.menu-items').classList.remove('hidden');
        }, 100);
    });

    document.getElementById('default').addEventListener('click', () => {
        let panel = document.querySelector('.info-panel');
        localStorage.clear();
        setup();
        panel.classList.add('hidden-panel');
        setTimeout(() => {
            document.getElementById('move_info').textContent = '0';
            document.getElementById('time_info').textContent = '00:00';
            panel.className = panel.className.replace(/ add-\d/g, '');
        }, 500);
    });

    document.getElementById('continue').addEventListener('click', () => {
        if (gameStart && document.getElementById('time').checked) {
            let time = document.getElementById('time_info').textContent.split(':');
            stopwatch = interval(+time[0], +time[1] + 1);
        }
        setTimeout(() => {
            if (!gameStart)
                document.getElementById('start_game').classList.add('show-button');
            else document.querySelector('.grid').classList.add('onfocus');
            document.querySelector('.menu').classList.remove('show-menu');
            document.getElementById('menu_button').classList.remove('hidden-panel');
        }, 100);
    });
}());