/*
@title: Random Face Drawer
@author: Bowie
@snapshot: example1.png, example2.png, example3.png
*/

const width = 125;
const height = 125;

var eyex = bt.randIntInRange(70, 110);
var eyey = bt.randIntInRange(-5, 10);
var eyesize = bt.randIntInRange(3, 5);

var noser = bt.randIntInRange(0, 1);

var facew = bt.randInRange(0.75, 1.2)
var faceh = bt.randInRange(0.75, 1.2)

var moutha = bt.randIntInRange(15, 80);
var mouthr = 10;


function ellipse(x, y, r, p, h, v, f) {
  var points = [];
  for (let i = 0; i <= Math.PI * 2; i += 1 / (p / (Math.PI * 2))) {
    points.push([x - h * r * Math.cos(i), y - v * r * Math.sin(i)]);
  }
  points.push([x - h * r * Math.cos(0), y - v * r * Math.sin(0)]);

  if (f == 1) {
    for (let q = x - r; q <= x + r; q += 8 / p) {
      points.push([x - h * r * Math.cos(q), y - v * r * Math.sin(q)]);
      points.push([x - h * r * Math.cos(q), y + v * r * Math.sin(q)]);
      // points.push([x + h * r * Math.cos(q), y - v * r * Math.sin(q)]);
      // points.push([x + h * r * Math.cos(q), y + v * r * Math.sin(q)]);
    }
    for (let q = x - r; q <= x + r; q += 8 / p) {
      // points.push([x - h * r * Math.cos(q), y - v * r * Math.sin(q)]);
      // points.push([x - h * r * Math.cos(q), y + v * r * Math.sin(q)]);
      points.push([x + h * r * Math.cos(q), y - v * r * Math.sin(q)]);
      points.push([x - h * r * Math.cos(q), y - v * r * Math.sin(q)]);
    }
  }
  drawLines([points]);
}

function curve(x, y, r, a1, a2, p) {
  var points = [];
  a1 /= (180 / Math.PI);
  a2 /= (180 / Math.PI);
  for (let i = a1; i <= a2; i += (a2 - a1) / p) {
    points.push([r * Math.cos(i) + x, r * Math.sin(i) + y]);
  }
  points.push([r * Math.cos(a2) + x, r * Math.sin(a2) + y]);
  drawLines([points]);
}



ellipse(width / 2, height / 2, width / 2 - 20, 100, facew, faceh, 0);
ellipse((width / 2 - (eyex * (facew / 2) ** 2)), height / 2 + (faceh * eyey), eyesize, 50, 1, 1, 1);
ellipse((width / 2 - (eyex * (facew / 2) ** 2)), height / 2 + (faceh * eyey), eyesize + 3, 50, 1, eyesize / (eyesize + 2), 0);
ellipse((width / 2 + (eyex * (facew / 2) ** 2)), height / 2 + (faceh * eyey), eyesize, 50, 1, 1, 1);
ellipse((width / 2 + (eyex * (facew / 2) ** 2)), height / 2 + (faceh * eyey), eyesize + 3, 50, 1, eyesize / (eyesize + 2), 0);
curve(width / 2, (height / 2) - Math.cos(Math.PI * moutha / 180) * mouthr, mouthr, 360 - 90 - moutha, 360 + moutha - 90, 20);
if (noser == 1) {
  curve(width / 2, (((height / 2) - Math.cos(Math.PI * moutha / 180) * mouthr) + (height / 2 + (faceh * eyey))) / 2, 4, -180, 0, 20);
} else {
  curve(width / 2, (((height / 2) - Math.cos(Math.PI * moutha / 180) * mouthr) + (height / 2 + (faceh * eyey))) / 2, 4, 0, 180, 20);
}
