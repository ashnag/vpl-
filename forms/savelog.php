<?php
// This file is part of VPL for Moodle - http://vpl.dis.ulpgc.es/
//
// VPL for Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// VPL for Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with VPL for Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Launches IDE
 * @package mod_vpl
 * @copyright 2012 Juan Carlos Rodríguez-del-Pino
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @author Juan Carlos Rodríguez-del-Pino <jcrodriguez@dis.ulpgc.es>
 */

global $CFG;
require_once dirname(__FILE__).'/../../../config.php';
require_once dirname(__FILE__).'/../locallib.php';
require_once dirname(__FILE__).'/../vpl.class.php';
require_once dirname(__FILE__).'/../vpl_submission.class.php';
require_once dirname(__FILE__).'/../editor/editor_utility.php';


header("Pragma: no-cache"); //Browser must reload page
vpl_editor_util::generate_requires();
require_login();
$id = required_param('id',PARAM_INT);
$userid = optional_param('userid',FALSE,PARAM_INT);
$copy = optional_param('privatecopy',false,PARAM_INT);
$subid = optional_param('submissionid',false,PARAM_INT);
$vpl = new mod_vpl($id);
$page_parms = array('id' => $id);
if($userid && !$copy){
    $page_parms['userid']= $userid;
}
if($copy){
    $page_parms['privatecopy']= 1;
}
$vpl->prepare_page('forms/edit.php', $page_parms);
if(!$vpl->is_visible()){
    notice(get_string('notavailable'));
}
if(!$vpl->is_submit_able()){
    print_error('notavailable');
}
if(!$userid || $userid == $USER->id){//Edit own submission
    $userid = $USER->id;
    $vpl->require_capability(VPL_SUBMIT_CAPABILITY);
}
else { //Edit other user submission
    $vpl->require_capability(VPL_MANAGE_CAPABILITY);
}
$vpl->network_check();
$vpl->password_check();
$instance= $vpl->get_instance();
$manager = $vpl->has_capability(VPL_MANAGE_CAPABILITY);
$grader = $vpl->has_capability(VPL_GRADE_CAPABILITY);
//This code allow to edit previous versions (only managers)
if($subid && $vpl->has_capability(VPL_MANAGE_CAPABILITY)){
    $parms = array('id'=> $subid, 'vpl'=> $instance->id ,'userid' =>$userid);
    $res = $DB->get_records('vpl_submissions', $parms);
    if(count($res)==1){
        $lastsub = $res[$subid];
    }else{
        $lastsub = false;
    }
}else{
    $lastsub = $vpl->last_user_submission($userid);
}
$options = Array();
$options['id']=$id;
$options['restrictededitor']=$instance->restrictededitor && !$grader;
$options['save']=!$instance->example;
$options['run']=($instance->run || $manager);
$options['debug']=($instance->debug || $manager);
$options['evaluate']=($instance->evaluate || $manager);
$options['example']=true && $instance->example;
$linkuserid = $copy?$USER->id:$userid;
$options['ajaxurl']="edit.json.php?id={$id}&userid={$linkuserid}&action=";
$options['download']="../views/downloadsubmission.php?id={$id}&userid={$linkuserid}";
//Get files
$files = Array();
$req_fgm = $vpl->get_required_fgm();
$options['resetfiles']=($req_fgm->is_populated() && !$instance->example);
$options['maxfiles']=$instance->maxfiles;
$req_filelist =$req_fgm->getFileList();
$min = count($req_filelist);
$options['minfiles']=$min;
$nf = count($req_filelist);
for( $i = 0; $i < $nf; $i++){
    $filename=$req_filelist[$i];
    $filedata=$req_fgm->getFileData($req_filelist[$i]);
    $files[$filename]=$filedata;
}
if($lastsub){
    $submission = new mod_vpl_submission($vpl, $lastsub);
    $fgp =  $submission->get_submitted_fgm();
    $filelist = $fgp->getFileList();
    $nf=count($filelist);
    for( $i = 0; $i < $nf; $i++){
       $filename=$filelist[$i];
       $filedata=$fgp->getFileData($filelist[$i]);
       $files[$filename]=$filedata;
    }
    $CE=$submission->get_CE_for_editor();
    \mod_vpl\event\submission_edited::log($submission);
}
session_write_close();
if($copy && $grader){
    $userid=$USER->id;
}
$vpl=new mod_vpl( $id );
$vl=$vpl->get_context();
//echo $CFG->dataroot."/vpl_data";

function arrayRecursiveDiff($aArray1, $aArray2) {
    $aReturn = array();

    foreach ($aArray1 as $mKey => $mValue) {
        if (array_key_exists($mKey, $aArray2)) {
            if (is_array($mValue)) {
                $aRecursiveDiff = arrayRecursiveDiff($mValue, $aArray2[$mKey]);
                if (count($aRecursiveDiff)) { $aReturn[$mKey] = $aRecursiveDiff; }
            } else {
                if ($mValue != $aArray2[$mKey]) {
                    $aReturn[$mKey] = $mValue;
                }
            }
        } else {
            $aReturn[$mKey] = $mValue;
        }
    }
    return $aReturn;
}

function arrayRecursiveAdd($array1, $array2){
    $output = array();

    foreach($array1 as $key => $value){
        if(array_key_exists($key, $array2)){
            if(is_array($value)){
                $recursiveAdd = arrayRecursiveAdd($value,$array2[$key]);
                if(count($recursiveAdd)) {$output[$key] = $recursiveAdd; }
            }else{
                if($value != $array2[$key]){
                    $output[$key] = $array2[$key];
                }
            }
        } else {
            $output[$key] = $value;
        }
    }
    return $output;
}

function log_add($log_array){
    $last_entry = $log_array[0];
    array_shift($log_array);
    foreach($log_array as $log_entry){
        $last_entry = arrayRecursiveAdd($last_entry,$log_entry);
    }
    return $last_entry;
}

function log_diff($last_log_entry,$new_log_array){
    $last_time = $last_log_entry['time'];
    $prev_log_entry = $last_log_entry;
    $appending_array = array();
    foreach($new_log_array as $new_log_entry) {
        if($new_log_entry['time'] > $last_time) {
            array_push($appending_array, arrayRecursiveDiff($new_log_entry, $prev_log_entry));
            $prev_log_entry = $new_log_entry;
        }
    }
    return $appending_array;
}

//index code
function my_readFile($my_fileName){
        $myfile = fopen($my_fileName, "r");
        if($myfile)
        {
            $f= fread($myfile,filesize($my_fileName));
            fclose($myfile);
            return $f;
        }
        return NULL;
    }
    $fileName=$_POST["fileName"];
    $rn=$_POST["rn"];
    $log=$_POST["log"];
    $id=$_POST["id"];
    $userid=$_POST["userid"];
    $newfilename=$CFG->dataroot."/vpl_data/".$instance->id."/usersdata/".$userid."/".$fileName."_log.json";
    $last=0;
    $logRead= my_readFile($newfilename);
    if($logRead){
        $logArr=  json_decode("[".$logRead."]",true);
        $last= end($logArr)['time'];
    }

//    $last = log_add($logArr);
    $logArr=  json_decode($log,true);
    if(json_last_error()==JSON_ERROR_NONE){
        $appendingArr=  array();
        foreach($logArr as $log_entry){
           if($log_entry['time']>$last){
               array_push($appendingArr,$log_entry);
            }
        }
//        $appendingArr = log_diff($last,$logArr);
        if(count($appendingArr)>0 ){
            $append_text=substr(json_encode($appendingArr),1,-1);
            if( $last['time']!=0){
                $append_text=",".$append_text;
            }
//            $append_text= \LZCompressor\LZString::compressToBase64($append_text);

            $myfile = fopen($newfilename , "a") ;


            if(fwrite($myfile, $append_text)!= FALSE){
                echo end($appendingArr)['time'];
            }else{
                echo 0;
            }
            fclose($myfile);
        }
        else{
        	echo 0;
        }
    }

