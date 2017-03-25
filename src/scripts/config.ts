export class config {
  public static googleMapsKey: string = 'AIzaSyDzl3LF54-nmF2Z8G4AhuiMLw_slLxsYC4';
  public static latitude: number = 37.09024;
  public static longitude: number = -95.712891;
  public static zoom: number = 5;
  public static leaps: number = 2;
  public static steps: number = 6;
  public static maxSteps: number = 100;

  public static os: string = 'windows';
  public static workers: number = 8;
  public static accountColumns: string = 'username, password';

  public static windowsTemplates: ICommandTemplate = {
    setup: 'taskkill /IM python.exe /F',
    server: 'Start "Server" /d {rocketmap-directory} /MIN python.exe runserver.py -os -l "{location}"',
    worker: 'Start "Worker{index}" /d {rocketmap-directory} /MIN python.exe runserver.py -ns -l "{location}" -st {steps} {auth-template}',
    auth: '-u {username} -p "{password}"',
    delay: 'ping 127.0.0.1 -n 6 > null',
    filename: 'launch.bat'
  };

  public static linuxTemplates: ICommandTemplate = {
    setup: '#!/usr/bin/env bash',
    server: 'nohup python runserver.py -os -l \'{location}\' &',
    worker: 'nohup python runserver.py -ns -l \'{location}\' -st {steps} {auth-template} &',
    auth: '-u {username} -p \'{password}\'',
    delay: 'sleep 0.5;',
    filename: 'launch.sh'
  };
};

export interface ICommandTemplate {
  setup: string;
  server: string;
  worker: string;
  auth: string;
  delay: string;
  filename: string;
}
