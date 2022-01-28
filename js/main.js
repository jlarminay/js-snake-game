//global variables
$turn = 0;
$start = false;
$game = true;
$timeBetween = 1;
$logs = true;

$detailed = false;
$auto_restart = true;
$record_history = true;

$print_method = 'table';

$map_grid = [];
$map_x = 10;
$map_y = 20;

$directions = ['u','u','u','u'];
$snakes = [];
$hunger = [100,100,100,100];
$foods = [];
$dead = [];

//define tiles
// $tile_empty =   ' ';
$tile_empty =   1;
$tile_food =    'f';
$tile_snakes =  ['A', 'B', 'C', 'D'];
$snake_count =  3;
$human = 1;
$ai = 2;

$wins = [0, 0, 0, 0];

$history = [];

var $main_loop;

$(document).ready(function(){

    //write history each turn
    function writeHistory(){
        $history[$turn] = {
            "snakes": $snakes,
            "hunger": $hunger,
            "": "",
        };
    }

    //creates map
    function generateGrid(){
        i = 0;
        map = [];
        while($map_x>i){
            j = 0;
            tmp = [];
            while($map_y>j){
                tmp.push($tile_empty);
                j++;
            }
            map.push(tmp);
            i++;
        }

        //add snakes
        $.each($snakes, function(i,ial){
            $.each(ial, function(j,jal){
                if(j==0){
                    // map[jal.x][jal.y] = $tile_snakes[i];
                    map[jal.x][jal.y] = 0
                }
                else{
                    // map[jal.x][jal.y] = ($tile_snakes[i]).toLowerCase();
                    map[jal.x][jal.y] = 0;
                }
            });
            //mark tail as passable
            if(ial.length>3){
                var tail = ial[ial.length-1];
                map[tail.x][tail.y] = 1;
            }
        });

        //add foods
        $.each($foods, function(i,val){
            map[val.x][val.y] = $tile_food;
        });

        $map_grid = map;
        writeGrid();
    }

    //print out grid on text
    function writeGrid(){
        if($print_method=='text'){
            $("#main-table").hide();
            $("#main-grid").show();
            grid = $("#main-grid");
            grid.val('');
            $.each($map_grid, function(i,val){
                grid.val( grid.val() + "\n" + val);
            });
        }
        if($print_method=='table'){
            $("#main-grid").hide();
            $("#main-table").show();
            table = $("#main-table");
            table.find("tr").remove();
            $.each($map_grid, function(i,val){
                tmp = "<tr>";
                $.each(val, function(j,jal){
                    tmp += "<td x='"+i+"' y='"+j+"'></td>";
                });
                tmp += "</tr>";
                table.append(tmp);
            });
            $.each($foods, function(i, val){
                $("td[x="+val.x+"][y="+val.y+"]").attr("tile", "f");
            });
            $.each($snakes, function(i, val){
                $.each(val, function(j, jal){
                    if(j==0){
                        $("td[x="+jal.x+"][y="+jal.y+"]").attr("tile", $tile_snakes[i]);
                    }
                    else{
                        $("td[x="+jal.x+"][y="+jal.y+"]").attr("tile", $tile_snakes[i].toLowerCase());
                    }
                });
            });
        }
    }

    //set initial nake head on random square
    function spawnSnake(){
        i = 0;
        while(i<$snake_count){
            var empty = false;
            while(!empty){
                var pos = {
                    "x": Math.floor(Math.random() * ($map_x-2))+2,
                    "y": Math.floor(Math.random() * ($map_y-2))+2
                };
                if( $map_grid[pos.x][pos.y] == $tile_empty ){
                    empty = true;
                }
            }
            writeLog("Spawned snake "+$tile_snakes[i]+" on "+pos.x+"-"+pos.y);
            $snakes[i] = [pos, pos, pos, pos];
            i++;
        }
    }

    //spawn a food item on random square
    function spawnFood(num=1){
        i = 0;
        while(i<num){
            var empty = false;
            while(!empty){
                var pos = {
                    "x": Math.floor(Math.random() * $map_x),
                    "y": Math.floor(Math.random() * $map_y)
                };
                if( $map_grid[pos.x][pos.y] == $tile_empty ){
                    empty = true;
                }
            }
            $foods.push(pos);
            writeLog("Spawned food on "+pos.x+"-"+pos.y);   
            i++;
        } 
    }

    //write string to log
    function writeLog(string){
        if($logs){
            $("#log-holder").show();
            $("#logs_write").val( $("#logs_write").val() + string + "\n" );
            var textarea = document.getElementById('logs_write');
            textarea.scrollTop = textarea.scrollHeight;
        }
        else{
            $("#log-holder").hide();
        }
    }

    //get next pos based on direction
    function getNextPos(cur, head){
        var next = [-1, -1];
        var dir = $directions[cur];
        if(dir=='u'){
            next = {
                "x": parseInt(head.x)-1, 
                "y": head.y
            };
        }
        if(dir=='d'){
            next = {
                "x": parseInt(head.x)+1,
                "y": head.y
            };
        }
        if(dir=='r'){
            next = {
                "x": head.x, 
                "y": parseInt(head.y)+1
            };
        }
        if(dir=='l'){
            next = {
                "x": head.x, 
                "y": parseInt(head.y)-1
            };
        }
        return next;
    }

    //check whats on the target square
    function checkTargetSquare(cur, next){
        //check if out of square
        if(next.x<0){
            return 'wall';
        }
        if(next.x>=$map_x){
            return 'wall';
        }
        if(next.y>=$map_y){
            return 'wall';
        }
        if(next.y<0){
            return 'wall';
        }

        var tail = $snakes[cur][$snakes[count].length-1];
        var tile = $map_grid[next.x][next.y];

        if(tile=="f"){
            return 'food';
        }
        if(tile!=$tile_empty && tail!=next){
            return 'self';
        }

    }

    //pad number with zeros
    function pad(num, len=3){
        return ("0000000000"+num).slice(-len);
    }

    //update fields on data table
    function updateData(){
        if($detailed){
            $("#data .detailed").show();
        }
        $("#data #data-game").text($start);
        $("#data #data-speed").text($timeBetween);
        $("#data #data-turn").text( pad($turn,4) );

        $.each($snakes, function(i, val){
            $("#snakes #data-"+i).show();
            type = "AI";
            if(i<$human){
                type = "Human";
            }
            if($auto_restart){
                $("#snakes .auto").show();
                $("#snakes #data-"+i+" .auto").text( pad($wins[i]) );
            }
            $("#snakes #data-"+i+" #data-"+i+"_typ").text(type);
            $("#snakes #data-"+i+" #data-"+i+"_hun progress").val($hunger[i]);
            $("#snakes #data-"+i+" #data-"+i+"_dir").text($directions[i]);
            $("#snakes #data-"+i+" #data-"+i+"_len").text( pad($snakes[i].length) );
        });
    }

    //move snake based on dir
    function moveSnake(cur){
        var head = $snakes[cur][0];
        var next = getNextPos(cur, head);
        writeLog("Snake "+$tile_snakes[cur]+" moved "+head.x+"-"+head.y+" -> "+next.x+"-"+next.y);

        var result = checkTargetSquare(cur, next);
        if(result=='wall'){
            writeLog("\nSnake "+$tile_snakes[cur]+" collided with wall");
            snakeDead(cur);
            return false;
        }
        if(result=='self'){
            writeLog("\nSnake "+$tile_snakes[cur]+" collided with self");
            snakeDead(cur);
            return false;
        }
        if(result=='food'){
            var last = $snakes[cur][$snakes[cur].length-1];
            $snakes[cur].push(last);
            for(var i = $foods.length - 1; i >= 0; i--) {
                if( ($foods[i].x==next.x) && ($foods[i].y==next.y) ) {
                    $foods.splice(i, 1);
                }
            }
            $hunger[cur] = 100;
            writeLog("Snake "+$tile_snakes[cur]+" ate food at "+next.x+"-"+next.y);
            spawnFood();
        }

        $snakes[cur].unshift(next);
        $snakes[cur].pop();
    }

    //snake died, end game and print game over
    function snakeDead(cur){
        $dead.push(cur);
        $snakes[cur] = [];
        writeLog("----- Snake "+$tile_snakes[count]+" Died  -----");

        if($dead.length >= $snake_count-1){
            won = -1;
            $.each($snakes, function(i,val){
                if(val.length > 0){
                    won = i;
                }
            });
            $wins[won] = $wins[won] + 1;
            $game = false;
            $start = false;
            writeLog("\n\n---------- Game Over  ----------");
            writeLog("---------- Snake "+i+" Won  ----------");
            clearInterval($main_loop);

            if($auto_restart){
                reloadGame();
            }
        }
    }

    //find closest food with an possible path
    function closestFood(cur){
        var head = $snakes[cur][0];
        var close = [];
        var dist = 100000000;
        $.each($foods, function(i, val){
            var d = 0;
            d += Math.abs(head.x - val.x);
            d += Math.abs(head.y - val.y);
            if(d<dist){
                dist = d;
                close = val;
            }
        });

        return close;
    }

    function getDirectionToPos(cur, target){
        var head = $snakes[cur][0];

        if(head.x>target.x && $directions[cur]!='d'){
            $directions[cur] = 'u';
        }
        else if(head.x<target.x && $directions[cur]!='u'){
            $directions[cur] = 'd';
        }
        else if(head.y>target.y && $directions[cur]!='r'){
            $directions[cur] = 'l';
        }
        else if(head.y<target.y && $directions[cur]!='l'){
            $directions[cur] = 'r';
        }

        return true;
    }

    //set game and restart
    function reloadGame(){
        clearInterval($main_loop);
        $turn = 0;
        $hunger = [100,100,100,100];
        $snakes = [];
        $foods = [];
        $dead = [];
        $game = true;
        $start = true;
        main();
    }

    // ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------
    //main game loop
    function main(){
        generateGrid();
        spawnSnake();
        generateGrid();
        spawnFood($snake_count+1);
        generateGrid();

        //main turn
        $main_loop = setInterval(function(){ 
            if($start){
                //game isn't paused

                for(count=0;count<=$snake_count-1;count++){
                    if(!$dead.includes(count)){

                        //remove 1 health
                        $hunger[count] = $hunger[count] - 1;
                        if($hunger[count] <= 0){
                            writeLog("\nSnake "+$tile_snakes[count]+" starved to death");
                            snakeDead(count);
                            return;
                        }

                        robot = false;
                        if(count>=$human){
                            robot = true;
                        }
                        writeLog("\n-Snake "+$tile_snakes[count]+" turn-");
                        if(robot){

                            //hungry go for food
                            if($hunger[count]<=75){
                                var food = closestFood(count);
                                writeLog("Snake "+$tile_snakes[count]+" closest food at "+food.x+"-"+food.y);
                                

                                var head = $snakes[count][0];
                                var graph = new Graph($map_grid);
                                var start = graph.grid[head.x][head.y];
                                var end = graph.grid[food.x][food.y];
                                var result = astar.search(graph, start, end);

                                if(result.length>0){
                                    getDirectionToPos(count, result[0]);
                                }
                                else{
                                    var tail = $snakes[count][$snakes[count].length-1];
                                    var end = graph.grid[tail.x][tail.y];
                                    var result = astar.search(graph, start, end);
                                    if(result.length>0){
                                        getDirectionToPos(count, result[0]);
                                    }
                                }
                            }
                            //not hungry fo for tail
                            else{

                                var tail = $snakes[count][$snakes[count].length-1];
                                var head = $snakes[count][0];
                                var graph = new Graph($map_grid);
                                var start = graph.grid[head.x][head.y];
                                var end = graph.grid[tail.x][tail.y];
                                var result = astar.search(graph, start, end);
                                if(result.length>0){
                                    getDirectionToPos(count, result[0]);
                                }

                            }

                        }
                        moveSnake(count);
                        generateGrid();
                    }
                }

                $turn++;
            }
            updateData();
        }, $timeBetween);
    }
    // ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------

    //start/pause
    $("button#start").click(function(){
        $start = !$start;
        if(!$game){
            $start = false;
        }
        updateData();
    });

    //restart
    $("button#restart").click(function(){
        $("#logs_write").val('');
        // location.reload(); 
        reloadGame();
    });

    //generate initial map
    $("button#generate").click(function(){
        //get settings
        $timeBetween =      parseInt($("#options #speed").val());
        $map_x =            parseInt($("#options #map_x").val());
        $map_y =            parseInt($("#options #map_y").val());
        $human =            parseInt($("#options #human").val());
        $ai =               parseInt($("#options #ai").val());
        $snake_count =      $human+$ai;
        if($snake_count>4){
            $snake_count = 4;
        }
        $print_method =     $("#options #map_type").val();
        $logs =             ($("#options #logs").val() == 'true');
        $detailed =         ($("#options #details").val() == 'true');
        $auto_restart =      ($("#options #auto_reload").val() == 'true');
        $record_history =   ($("#options #history").val() == 'true');

        // run main loop
        main();
        $("#options").slideUp();
        $("#game").slideDown();
    });

    //generate initial map
    $("#extra").click(function(e){
        e.preventDefault();
        $("tr.extra").toggle();
    });

    //watch for keydown
    document.onkeydown = function (e) {
        e = e || window.event;

        if($human>0){
            //player 1
            if(e.keyCode == 87 && $directions[0]!='d'){
                $directions[0] = 'u';
            }
            if(e.keyCode == 83 && $directions[0]!='u'){
                $directions[0] = 'd';
            }
            if(e.keyCode == 68 && $directions[0]!='l'){
                $directions[0] = 'r';
            }
            if(e.keyCode == 65 && $directions[0]!='r'){
                $directions[0] = 'l';
            }
        }
        if($human>1){
            //player 2
            if(e.keyCode == 38 && $directions[1]!='d'){
                $directions[1] = 'u';
            }
            if(e.keyCode == 40 && $directions[1]!='u'){
                $directions[1] = 'd';
            }
            if(e.keyCode == 39 && $directions[1]!='l'){
                $directions[1] = 'r';
            }
            if(e.keyCode == 37 && $directions[1]!='r'){
                $directions[1] = 'l';
            }
        }
        updateData();
    };

});