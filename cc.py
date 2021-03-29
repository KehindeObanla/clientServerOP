import socket
import random
from datetime import datetime
from datetime import date
import random
import time
import json
import sys
import argparse




def genratetime(num):
    listedrand =[]
    for i in range(num):
        x = random.uniform(0, 1)
        listedrand.append(x)
    return listedrand
igenerate = False
listed = [0.5,0.1,1,2]
parser = argparse.ArgumentParser(description='producer client')
parser.add_argument('Client',type =int,nargs="?",default= 4, metavar='',help='number of Clients' )
parser.add_argument('time',type=list,nargs="*",default =[0.5,0.1,1,2],metavar='',help='list to time qunatums')
args = parser.parse_args()
if(len(args.time) < args.Client):
    igenerate = True
    args.time = genratetime(args.Client)
    listed =genratetime(args.Client)


def Main(clientnum,timeqp): 
    host = '167.99.224.154'  # The server's hostname or IP address
    port = 11000        # The port used by the server
    count = clientnum
    while True:
        for i in range(clientnum):
            s = socket.socket(socket.AF_INET,socket.SOCK_STREAM) 
        
            # connect to server on local computer 
            s.connect((host,port)) 
        
            # message you send to server 
            while True:
                    # message sent to server
                if(listed == timeqp):
                    times = timeqp[i]
                else:
                    
                    if(igenerate):
                        times = timeqp[i]
                    else:
                        times =float(timeqp[i][0])
                time.sleep(times) 
                tosend ='consume'+ ","+str(times)
                s.send(tosend.encode('ascii')) 
                # messaga received from server 
                data = s.recv(20486)
                # print the received message 
                print('Received from the server :',str(data.decode('ascii'))) 
                
                # close the connection
                s.close()
                break 
        
if __name__ == '__main__':
    Main(args.Client,args.time)
    
