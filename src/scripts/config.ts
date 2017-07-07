export class config {
  public static googleMapsKey: string = 'AIzaSyCjk02e-YrZ6qLWn_38Ruy9wKg7Q7NcGQU';
  public static latitude: number = 39.7683;
  public static longitude: number = -86.1652;
  public static zoom: number = 10;
  public static leaps: number = 1;
  public static steps: number = 18;
  public static maxSteps: number = 100;

  public static os: string = 'windows';
  public static scriptDelay: number = 300;
  public static rocketmapDirectory: string = 'D:\\RocketMap';
  public static accountDirectory: string = 'workers/';

  public static windowsTemplates: ICommandTemplate = {
    setup: 'taskkill /IM python.exe /F',
    alarm: 'Start "Alarm" /d {rocketmap-directory} /MIN python.exe Tools/PokeAlarm/start_pokealarm.py {alarm-options}',
    server: 'Start "Server" /d {rocketmap-directory} /MIN python.exe runserver.py -os -l "{location}" {server-options}',
    worker: 'Start "Worker{index}" /d {rocketmap-directory} /MIN python.exe runserver.py -ns -ac {account-directory}hive{index}.csv -l "{location}" {worker-options} -st {steps} -w {workers}',
    delay: 'ping 127.0.0.1 -n {script-delay} > null',
    filename: 'start-scan.bat'
  };

  public static linuxTemplates: ICommandTemplate = {
    setup: '#!/usr/bin/env bash',
    alarm: 'screen -d -m -S ALARM python Tools/PokeAlarm/start_pokealarm.py {alarm-options}',
    server: 'screen -d -m -S MAP python runserver.py -os -l \'{location}\' {server-options}',
    worker: 'screen -d -m -S HIVE{index} python runserver.py -ns -ac {account-directory}hive{index}.csv -l \'{location}\' {worker-options} -st {steps} -w {workers}',
    delay: 'sleep {script-delay}',
    filename: 'start-scan.sh'
  };
}

export interface ICommandTemplate {
  setup: string;
  alarm: string;
  server: string;
  worker: string;
  delay: string;
  filename: string;
}
